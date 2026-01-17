# eWeLink V2 - OAuth

This library is based on the [eWeLink API Next](https://github.com/nocmt/ewelink-api-next) which is based on the [Official API](https://coolkit-technologies.github.io/eWeLink-API/#/en/PlatformOverview).

## 1. OAuth processus

To simplify the OAuth authentication system, it works like that:
- An application wanted to authenticate a user call an Authentication Server with a redirect URL to receive user information after authentication
- The Authentication server is asking the user to authenticate
- If the authentication information is valid, the Authentication Server send to the redirect URL the informations identifying the user
- The application can use this information to communicate with all servers based on the Authentication Server

In our case, the Authentication Server is the eWeLink Authentication Server, the application is your Node Red server and the servers based on the Authentication Server are the eWeLink server managing your devices.

Concerning the redirect URL the authentication node of this library is exposising it for you and it follows this pattern:

https://{your node red server}/ewelink-auth/auth/callback

Becareful, the eWeLink Authentication server requires that your redirect URL use SSL.

If you have not implemented SSL on your local system, you can simply put "https" as protocol, and once the eWeLink Authentication Server redirects your browser to your redirect URL, you will have 30s to modify the URL by just replacing "https" by "http".

## 2. eWeLink Authentication Setup

This library is not automatically setup with generic Application information to communicate with eWeLink Authentication Server. It means that you will have to generate those information for your own installation.

### 2.1. Ask developper account

First you need to create a developper account in the eWeLink Authentication Server by following this link:
https://dev.ewelink.cc/

Create an account, then go to "My Center" => "Settings" and ask a developper account. It can take multiple days to be validated.

Once your developper account validated, you will be able to create a new application.

### 2.2. Create an application

In the same site, go to the menu "Console", and click on the "Create" button.

It will ask you:
- App Name: the name you want to give to your app
- App Profile: the description of your app
- App Type (not modifyable if you have personal developper account): OAuth2.0
- App Role (not modifyable if you have personal developper account): Standard Role
- Redirect URL: the URL on which you will be redirected once authenticated ("https://{your node red server}/ewelink-auth/auth/callback", just replace "{your node red server}" by the IP and port or the DNS name to access your node red server) /!\ This URL needs to use HTTPS protocol

Once your application created, it will give you the information you need to communicate. To Configure your nodes, you will need:
- The redirect URL
- The APPID
- The APP SECRET

## 3. Node Red Setup

When you will use your first node of this library, you will be asked to create an authentication in the "connection" field.

It is there you will need to put the application Id, application secret and redirect URL collected in the previous step.

Then click on the "Start Authentication" button, it will open a new tab in your browser, redirecting you to the eWeLink Authentication server for you to enter your credential informations.

Once you are authenticated, if everything worked correctly, you will be redirected to a page in your Node Red server indicating you that the authentication worked and the page will be automatically closed in few seconds.

You can then go back to Node Red and see that the authentication editor has changed and is showing you your region + your token. You can click on Done and start to use the different nodes.

For the next nodes, you can reuse the same authentication or create new ones if you need.

### 3.1. Home Node

This node enable you to collect information of your "family" in eWeLink.

It requires an input message to be triggered, but does not use any information about the input.

To have mode information about familly and the format of the output, you can check the 2 libraries documentation (see at the top).

### 3.2. List Devices

This node enable you to collect information of your "devices" in eWeLink.

It requires an input message to be triggered, but does not use any information about the input.

To have mode information about the format of the output, you can check the 2 libraries documentation (see at the top).

### 3.3. Device Status

This node enable you to collect information of a specific "device" in eWeLink.

It requires an input message to be triggered.

As input this node need the Device ID which can be provided directly in the node as a string (in this case the input message is not used) or from the input message (in this case you need to inform where in the input message to find it).

To have mode information about the format of the output, you can check the 2 libraries documentation (see at the top).

### 3.3. Set Status

This node enable you to set the status of a specific "device" in eWeLink.

It requires an input message to be triggered.

As input this node need the Device ID and the Params to set.

The Device ID can be provided directly in the node as a string or from the input message (in this case you need to inform where in the input message to find it).

The Params can be provided directly in the node as a string or as a JSON or from the input message (in this case you need to inform where in the input message to find it).

To have mode information about the format of the params, you can check the 2 libraries documentation (see at the top).

### 3.4. Event Messages

This node enable you to open a direct connection to the eWelink servers in order to receive envent messages from it.

It requires no input.

As output, it will send the messages emitted by eWelink, the format depends on the message type and the device type.

It requires at least a Api Key, it can be retreived by calling any of the other api (Home, Device List, etc.) and is part of the answer in the field "apikey".

If you leave the Device ID setup empty, it will output all the events no matter what (except technical event like the handcheck reponse or the heartbeat messages).

You have the possibility to put your Device ID to automatically filter the output on only one device.

Currently, if there is a disconnection or an error, it will not reconnect automatically. It is one of the future enhancement on this node.

## 4. Known issues and not yest tested features

### 4.1. Authentication token renewal
The authentication token is valid only 1 month, after this period it needs to be renewed. This process is implemented in the library, but not yet tested in real conditions. It can leads to some issues.

### 4.2. Refresh token validity
The refresh token is valid only 2 months, so if the nodes are not used during this amount of time, it should not be possible to use the automatic token renewale, you will need to create a new authentication in Node Red.

### 4.3. eWeLink application expiration
The application you are creating with a personal developper account in the eWeLink Authentication Server is valid for only 1 year and there is no automatic renewal possible, as it requires your login and password to create an application and we are not requirering this information from you. It means that after 1 year you will need to create a new application, with new Application ID and Application Secret and create a new authentication in Node Red with those new values.