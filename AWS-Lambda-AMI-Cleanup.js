var http = require('http');

const AWS = require('aws-sdk');
const url = require('url');
const https = require('https');

exports.handler = (event, context, callback) => {
	//const region = process.env.region;
	global.region = event.region;
	global.retentionNumber = event.retentionNumber;
	global.test = event.test;

	global.ec2 = new AWS.EC2({region: global.region});

	getAMIs();
};

function getAMIs(response) {
	var packerTags = [
	"webserver",
	"cpwebserver",
	"neuron",
	"contentdelivery",
	"oltp",
	"etl",
	"dw"
	]

	packerTags.forEach(function(value){
		 var params = {
		 		Filters: [
		 			{
		 				Name: 'tag:Packer',
		 				Values: [
		 					value
		 				]
		 			}
		 		],
		 		Owners: [
		 			'610667881604'
		 		]
		 	};

			global.ec2.describeImages(params, function(err, data) {
				if (err) console.log(err, err.stack); // an error occurred
				else {
					var images = data.Images
					images.sort(function(a, b){
						var dateA=new Date(a.CreationDate), dateB=new Date(b.CreationDate)
						return dateB-dateA
					})
					//console.log(data)
					console.log("Number of Images " + value + ": " + images.length)
					for(var i = global.retentionNumber; i < images.length; i++){
						deregisterImage(images[i].ImageId)
						console.log("Deregister Image: " + images[i].Name + " dated: " + images[i].CreationDate)
						for(var x = 0; x < images[i].BlockDeviceMappings.length; x++){
							if (images[i].BlockDeviceMappings[x].Ebs != null) {
								//Remove SnapShots
								console.log("Delete Snapshot: " + images[i].BlockDeviceMappings[x].Ebs.SnapshotId)
								deleteSnapshot(images[i].BlockDeviceMappings[x].Ebs.SnapshotId)
							}
						}
					}
				}
			});
	});
}

function deregisterImage(imageName) {

	if ( test == "False"){
		var dryRun = false
	}
	else{
		var dryRun = true
	}

	var paramsDeRegister = {
	  ImageId: imageName, /* required */
	  DryRun: dryRun
	};
	console.log("Deleting Image: " + imageName)
	global.ec2.deregisterImage(paramsDeRegister, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else {
			console.log(data)
		}
	});
}

function deleteSnapshot(snapshotId){
	if ( test == "False"){
		var dryRun = false
	}
	else{
		var dryRun = true
	}

	var params = {
   SnapshotId: snapshotId,
	 DryRun: dryRun
  };
	console.log("Deleting SnapShot: " + snapshotId)
  global.ec2.deleteSnapshot(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
}
