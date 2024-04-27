# JSOAuthC

[中文](https://github.com/lucasnova606/JSOAuthC/blob/main/README.md) | [English](https://github.com/lucasnova606/JSOAuthC/blob/main/README_ENG.md)

## Introduction

JSOAuthC is a sample program primarily written in JavaScript that demonstrates the implementation of OAuth authentication for obtaining tokens. The program consists of two parts: a browser-side JavaScript program and a Node.js server version.

During the development and testing of this program, the following environment was used: Windows 10, Chrome Version 114.0.5735.199 (Official Build) (64-bit), Node.js v16.18.0, and Keycloak 24.0.2 as the authentication server.

The program implements the token acquisition part of the OAuth authentication mechanism and supports two flows: the client credentials flow and the authorization code flow.

The program can be divided into two major parts:

1. Browser Version: The JavaScript files for the browser version are located in the `./Javascript/` directory. It is recommended to use Visual Studio Code with the Live Server extension to open this directory for testing in a browser.
2. Server Version: Switch to the root directory of the program, run `npm install` to install the required packages, and then execute `node server.js` to start the server. To test the authorization code flow, access `/api/auth/authorization_code` in the browser. To test the client credentials flow, access `/api/auth/client_credentials`.

## Installation

To install and set up the program, follow these steps:

1. Make sure you have Node.js v16.18.0 or a later version installed.
2. Download the program as a ZIP file or clone the repository using Git.
3. If you downloaded a ZIP file, extract its contents.
4. Open a command prompt or terminal and navigate to the program directory.
5. Edit configOAuth.json settings.

## Execution

To run the program, follow these steps:

1. Browser Version:
   - Use Visual Studio Code to open the `./Javascript/` directory.
   - Launch the Live Server.
   - Access the corresponding URL in the browser to use the program.
   - If you run into CORS issues, you can use Chrome's CORS Unblock plugin or fix it yourself.
2. Server Version:
   - In the command prompt or terminal, navigate to the program directory.
   - Run `npm install` to install the required packages.
   - Execute `node server.js` to start the server.
   - Access `/api/auth/authorization_code` in the browser to test the authorization code flow, or access `/api/auth/client_credentials` to test the client credentials flow.
   - If you run into CORS issues, you can use Chrome's CORS Unblock plugin or fix it yourself.

## Keycloak設定相關提示

Remember to add a scope named "openid" to the client and enable the "Include in token scope" option in the scope settings.