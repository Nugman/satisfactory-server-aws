export const Config = {
     // Required parameters
     // ===================

     // Server region and EC2 machineImage AMI-ID.
     // Set region as required for lowest latency, set EC2 machineImage AMI-ID
     // to be the amd64 Ubuntu version that you want to run. Look up the
     // appropriate ID here: https://cloud-images.ubuntu.com/locator/ec2/
     region: '',
     ec2MachineImage: 'ami-074d4131321dc4f06',

     // server hosting account
     account: '',

     // prefix for all resources in this app
     prefix: 'SatisfactoryHosting',

     // Type of instance to use to host Satisfactory. m6a.xlarge meets
     // requirements for Satisfactory v1.0, but adjust as required for
     // price/performance. Cheaper instances will host smaller maps, but may
     // struggle as your factory grows. Larger instances will host larger
     // factories, but will be a waste money with smaller factories.
     //
     // This can also be changed as necessary as your factory grows!()
     ec2InstanceType: 'm6a.xlarge',

     // set to false if you don't want an api to
     // restart game server and true if you do
     restartApi: true,

     // Set to true if you want to use Satisfactory Experimental
     useExperimentalBuild: false,

     // ------------------------------------------------------------------------

     // Optional parameters
     // ===================

     // Bucket for storing save files. You can use an existing bucket or leave
     // it empty to create a new one
     bucketName: '',

     // Server hosting VPC
     // Create a vpc and its ID here or leave it empty to use default VPC
     vpcId: '',

     // Server subnet. Leave blank (preferred option) for auto-placement
     // If vpcId is given, specify subnet for that VPC. Otherwise, specify the
     // subnet in the default VPC to use.
     subnetId: '',

     // Needed if subnetId is specified (e.g. us-west-2a).
     availabilityZone: '',

     // Needed if you want to use DuckDNS domain
     duckDnsDomain: "",
     duckDnsToken: ""
};
