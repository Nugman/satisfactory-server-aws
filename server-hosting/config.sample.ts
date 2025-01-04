export const Config = {
     // compulsory parameters

     // Server region and EC2 machineImage AMI-ID.
     // Set region as required for lowest latency, set EC2 machineImage AMI-ID
     // to be the amd64 Ubuntu version that you want to run. Look up the
     // appropriate ID here: https://cloud-images.ubuntu.com/locator/ec2/
     region: '',
     ec2MachineImage: 'ami-0c1871cb16e34a297',

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

     // optional parameters

     // bucket for storing save files
     // you can use an existing bucket
     // or leave it empty to create a new one
     bucketName: '',
     // server hosting vpc
     // Create a vpc and it's id here
     // or leave it empty to use default vpc
     vpcId: '',
     // specify server subnet
     // leave blank (preferred option) for auto-placement
     // If vpc is given specify subnet for that vpc
     // If vpc is not given specify subnet for default vpc
     subnetId: '',
     // Needed if subnetId is specified (i.e. us-west-2a)
     availabilityZone: ''
};
