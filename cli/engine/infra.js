
import {
  EC2Client,
  RunInstancesCommand,
  CreateVolumeCommand,
  AttachVolumeCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { profiles } from '../profiles/profiles.client';


export const engineInfra = {

    ec2: null,

    initialiseClient: ({ availabilityZone }) => {
        if (!engineInfra.ec2) {
            engineInfra.ec2 = new EC2Client({ region: availabilityZone });
        }

        return engineInfra.ec2;
    }, 

    initialiseInstance: async ({ availabilityZone, instanceType, ami, size }) => {
        try {
            engineInfra.ec2 = await new EC2Client({
                region: availabilityZone
            });
            
            const volumeId = await engineInfra.createVolume({
                availabilityZone,
                size
            });

            const instanceId = await engineInfra.createInstance({
                ami,
                instanceType,
                availabilityZone,
                volumeId
            });

            profiles.setEngineInstanceId({
                instanceId
            });

            await engineInfra.waitForInstanceRunning({
                instanceId
            })
        } catch (error) {
            console.error('Error initialising gnar engine agent instance', error);
        }
    },

    createVolume: async ({availabilityZone, size}) => {
        const params = {
            AvailabilityZone: availabilityZone,
            Size: size || 50,
            VolumeType: "gp3",
        };
        const data = await engineinfra.ec2.send(new CreateVolumeCommand(params));
        return data.VolumeId;
    },

    createInstance: async ({ami, instanceType, availabilityZone, volumeId}) => {
        const params = {
            ImageId: ami,
            InstanceType: instanceType || "g5.xlarge",
            MinCount: 1,
            MaxCount: 1,
            Placement: {
                AvailabilityZone: availabilityZone
            },
            BlockDeviceMappings: [{
                DeviceName: "/dev/nvme1n1", // Additional volume mount
                Ebs: { VolumeId: volumeId, DeleteOnTermination: true },
            }],
            TagSpecifications: [{
                ResourceType: "instance",
                Tags: [{ Key: "Name", Value: "gnar-engine-agent" }],
            }]
        };

        const data = await engineInfra.ec2.send(new RunInstancesCommand(params));
        return data.Instances[0].InstanceId;
    },

    waitForInstanceRunning: async ({instanceId}) => {
        while (true) {
            const desc = await engineInfra.ec2.send(
                new DescribeInstancesCommand({ InstanceIds: [instanceId] })
            );
            
            const state = desc.Reservations[0].Instances[0].State.Name;
            console.log(`Instance ${instanceId} is ${state}`);
            
            if (state === "running") {
                console.log('Instance ready!');
                break;
            }
            
            await new Promise((r) => setTimeout(r, 5000));
        }
    },

    startInstanceSession: async ({timeout, instanceId}) => {
        // start instance
        engineInfra.initialiseClient({ region });

        // Start instance
        await engineInfra.ec2.send(new StartInstancesCommand({
            InstanceIds: [instanceId],
        }));
        console.log(`Instance ${instanceId} is starting...`);

        // Wait for running state (reuse your existing method)
        await engineInfra.waitForInstanceRunning({ instanceId });
        
        // tag instance with shutdown timestamp
        engineInfra.tagInstanceWithShutdown({
            timeout,
            instanceId
        });
    },

    tagInstanceWithShutdown: async ({timeout, instanceId}) => {
        const now = Math.floor(Date.now() / 1000);
        const shutdownTimestamp = now + timeout * 60;

        await engineInfra.ec2.send(new CreateTagsCommand({
            Resources: [instanceId],
            Tags: [{
                Key: "shutdown-timestamp",
                Value: shutdownTimestamp.toString(),
            }],
        }));
    },

    addCrontabShutdownCheck: async ({instanceId}) => {
        

    }
}
