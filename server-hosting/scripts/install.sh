#!/bin/sh

# Note: Arguments to this script
#  1: string - S3 bucket for your backup save files (required)
#  2: true|false - whether to use Satisfactory Experimental build (required)
#  3: true|false - whether to use mods (required)
#  4: true|false - whether to use DuckDNS (optional, default false)
#  5: string - DuckDNS Domain Name (optional)
#  6: string - DuckDNS Token (optional)
S3_SAVE_BUCKET=$1
USE_EXPERIMENTAL_BUILD=${2-false}
USE_MODS=${3-false}
USE_DUCK_DNS=${4-false}
DOMAIN=$5
TOKEN=$6


# Check if S3 bucket is provided
if [ -z "$1" ]; then
    echo "Error: S3 bucket is required."
    exit 1
fi

# Check if Satisfactory Experimental build setting is provided
if [ -z "$2" ]; then
    echo "Error: Satisfactory Experimental build setting is required (true/false)."
    exit 1
fi

# install steamcmd: https://developer.valvesoftware.com/wiki/SteamCMD?__cf_chl_jschl_tk__=pmd_WNQPOiK18.h0rf16RCYrARI2s8_84hUMwT.7N1xHYcs-1635248050-0-gqNtZGzNAiWjcnBszQiR#Linux.2FmacOS)
add-apt-repository multiverse
dpkg --add-architecture i386
apt update

# Needed to accept steam license without hangup
echo steam steam/question 'select' "I AGREE" | sudo debconf-set-selections
echo steam steam/license note '' | sudo debconf-set-selections

apt install -y unzip ca-certificates locales lib32gcc-s1 libsdl2-2.0-0:i386 lib32gcc-s1 steamcmd

# install satisfactory: https://satisfactory.fandom.com/wiki/Dedicated_servers
if [ $USE_EXPERIMENTAL_BUILD = "true" ]; then
    STEAM_INSTALL_SCRIPT="/usr/games/steamcmd +login anonymous +app_update 1690800 -beta experimental validate +quit"
else
    STEAM_INSTALL_SCRIPT="/usr/games/steamcmd +login anonymous +app_update 1690800 validate +quit"
fi
# note, we are switching users because steam doesn't recommend running steamcmd as root
su - ubuntu -c "$STEAM_INSTALL_SCRIPT"


if [ $USE_MODS = "true" ]; then
# install Satisfactory Mod Manager
    /usr/bin/wget https://github.com/satisfactorymodding/ficsit-cli/releases/download/v0.6.0/ficsit_linux_amd64.deb -O /tmp/ficsit_linux_amd64.deb
    /usr/bin/apt install /tmp/ficsit_linux_amd64.deb
    rm /tmp/ficsit_linux_amd64.deb

    # init installation
    su - ubuntu -c "/usr/bin/ficsit installation add /home/ubuntu/.local/share/Steam/steamapps/common/SatisfactoryDedicatedServer/"

    # create config for installed mods
cat << EOF > /home/ubuntu/.local/share/ficsit/profiles.json
{
    "profiles": {
        "Default": {
            "mods": {
                "DaisyChainEverything": {
                    "version": ">=1.0.9",
                    "enabled": true
                },
                "InfiniteZoop": {
                    "version": ">=1.8.23",
                    "enabled": true
                },
                "CurveBuilder": {
                    "version": ">=1.0.4",
                    "enabled": true
                }
            },
            "name": "Default",
            "required_targets": null
        }
    },
    "selected_profile": "Default",
    "version": 0
}
EOF
    # apply mods
    su - ubuntu -c "/usr/bin/ficsit apply"
fi

# enable as server so it stays up and start: https://satisfactory.fandom.com/wiki/Dedicated_servers/Running_as_a_Service
cat << EOF > /etc/systemd/system/satisfactory.service
[Unit]
Description=Satisfactory dedicated server
Wants=network-online.target
After=syslog.target network.target nss-lookup.target network-online.target

[Service]
Environment="LD_LIBRARY_PATH=./linux64"
ExecStartPre=$STEAM_INSTALL_SCRIPT
ExecStart=/home/ubuntu/.steam/steam/steamapps/common/SatisfactoryDedicatedServer/FactoryServer.sh
User=ubuntu
Group=ubuntu
StandardOutput=journal
Restart=on-failure
KillSignal=SIGINT
WorkingDirectory=/home/ubuntu/.steam/steam/steamapps/common/SatisfactoryDedicatedServer

[Install]
WantedBy=multi-user.target
EOF
systemctl enable satisfactory
systemctl start satisfactory

# enable auto shutdown: https://github.com/feydan/satisfactory-tools/tree/main/shutdown
cat << 'EOF' > /home/ubuntu/auto-shutdown.sh
#!/bin/sh

shutdownIdleMinutes=15
idleCheckFrequencySeconds=1

isIdle=0
while [ $isIdle -le 0 ]; do
    isIdle=1
    iterations=$((60 / $idleCheckFrequencySeconds * $shutdownIdleMinutes))
    while [ $iterations -gt 0 ]; do
        sleep $idleCheckFrequencySeconds
        connectionBytes=$(ss -lu | grep 777 | awk -F ' ' '{s+=$2} END {print s}')
        if [ ! -z $connectionBytes ] && [ $connectionBytes -gt 0 ]; then
            isIdle=0
        fi
        if [ $isIdle -le 0 ] && [ $(($iterations % 21)) -eq 0 ]; then
           echo "Activity detected, resetting shutdown timer to $shutdownIdleMinutes minutes."
           break
        fi
        iterations=$(($iterations-1))
    done
done

echo "No activity detected for $shutdownIdleMinutes minutes, shutting down."
sudo shutdown -h now
EOF
chmod +x /home/ubuntu/auto-shutdown.sh
chown ubuntu:ubuntu /home/ubuntu/auto-shutdown.sh

cat << 'EOF' > /etc/systemd/system/auto-shutdown.service
[Unit]
Description=Auto shutdown if no one is playing Satisfactory
After=syslog.target network.target nss-lookup.target network-online.target

[Service]
Environment="LD_LIBRARY_PATH=./linux64"
ExecStart=/home/ubuntu/auto-shutdown.sh
User=ubuntu
Group=ubuntu
StandardOutput=journal
Restart=on-failure
KillSignal=SIGINT
WorkingDirectory=/home/ubuntu

[Install]
WantedBy=multi-user.target
EOF
systemctl enable auto-shutdown
systemctl start auto-shutdown

# enable DuckDNS
if [ "$USE_DUCK_DNS" = "true" ]; then
    curl "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN"
    # Add the DuckDNS update command to crontab for the user
    su - ubuntu -c " (crontab -l 2>/dev/null; echo \"@reboot            /usr/bin/curl 'https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN'\") | crontab -"
fi

# enable automated backups to S3 Bucket every 5 minutes
su - ubuntu -c " (crontab -l 2>/dev/null; echo \"*/5 * * * *        /usr/local/bin/aws s3 sync /home/ubuntu/.config/Epic/FactoryGame/Saved/SaveGames s3://$S3_SAVE_BUCKET\") | crontab -"

# restore saves from S3 Bucket
su - ubuntu -c "/usr/local/bin/aws s3 sync s3://$S3_SAVE_BUCKET /home/ubuntu/.config/Epic/FactoryGame/Saved/SaveGames"