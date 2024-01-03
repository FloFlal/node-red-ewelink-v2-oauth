## README

Using the library [eWeLink API Next](https://github.com/nocmt/ewelink-api-next) which is based on the [Official API](https://coolkit-technologies.github.io/eWeLink-API/#/en/PlatformOverview).

### The nodes
![get-status](https://github.com/FloFlal/node-red-ewelink-v2-oauth/blob/1fa97bad4c02f6fb0daa6336ae2c8a89862b3d43/docs/images/ewelink-v2-get-status.png)
![get-home](https://github.com/FloFlal/node-red-ewelink-v2-oauth/blob/1fa97bad4c02f6fb0daa6336ae2c8a89862b3d43/docs/images/ewelink-v2-home.png)
![list-devices](https://github.com/FloFlal/node-red-ewelink-v2-oauth/blob/1fa97bad4c02f6fb0daa6336ae2c8a89862b3d43/docs/images/ewelink-v2-list-devices.png)
![set-status](https://github.com/FloFlal/node-red-ewelink-v2-oauth/blob/1fa97bad4c02f6fb0daa6336ae2c8a89862b3d43/docs/images/ewelink-v2-set-status.png)

### Documentation

Full documentation here: (in progress) [/docs/index.md](https://github.com/FloFlal/node-red-ewelink-v2-oauth/blob/1fa97bad4c02f6fb0daa6336ae2c8a89862b3d43/docs/index.md)

### Node Red eWeLink V2

The nodes developped in the project are meant to be used to communicate with the eWeLink cloud in order to manage the status of your devices from your node red server.

This impementation is using the OAuth authentication method put in place by eWeLink and we are not providing application id or application secret for it to work.
It means that to make it works for you, you will need to create an account in the eWeLink developper plateform and create your own application id and application secret.

### Security

Due to the OAuth authentication method, the nodes are NOT saving any login or password to eWeLink. Using the application id and application secret, the nodes are requesting tokens to eWeLink, that are those tokens that are stored in the nodes.

### Limitation

Using this method of authentication and personal tokens, eWeLink is limiting the number of actions you can perform with their API. Those limitation are not related to the nodes and currently (in Dec 2023), we are limited to the following endpoint:
| Endpoint | Name | Description |
| -------- | ---- | ----------- |
| POST@/v2/user/oauth/token | Apply for third-party authorization credentials interface | After the user is authorized to log in, the code is returned, and the platform gets the code to obtain the user's token |
| GET@/v2/family | Get home and room List | There is at least 1 family under the user account |
| POST@/v2/user/refresh | Refresh Token | "Access Token" expires in 30 days (for security reasons). At this time, you can use "Refresh Token" to refresh to obtain "Access Token" instead of logging in again. |
| GET@/v2/device/thing | Get Thing List | Get all the group and device information under the specified family ID |
| DELETE@/v2/user/oauth/token | Unbind third party accounts | Unbind third party accounts |
| POST@/v2/device/thing | Get Specified Things list | Get information about a specified group or device |
| GET@/v2/device/thing/status | Get Device or Group Status | Get the status of a single device or a single group, such as switch status, etc. |
| POST@/v2/device/thing/status | Update the Status of a Device or Group | Set the status of the device or group, such as switch status, etc. |
| POST@/v2/device/thing/batch-status | Update the Status of Multiple Devices or Groups | Set the status of devices or groups in batches, such as switch status, etc. |

I have made the choice to not implement all calls in nodes, as for example the update of multiple status of multiple devices or groups, as it can easily be split in multiple update of status of a device or group.
