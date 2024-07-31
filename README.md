# User Workspace Management Jupyter Extension

This extension offers general workspace management features. These include:

1. Displays ssh info for a user to get onto the kubernetes cluster container for their workspace.
2. Injects the users SSH key into their workspace from their auth profile (keycloak). This injection happens automatically when any user opens up the workspace, so no additional step is needed to allow a user to ssh into the container.
3. Mount user and org s3 buckets
4. Provide user sharable signed s3 link
5. Update keycloak token at set time interval so users don't get blocked from using token enabled features after a few minutes

This extension is dependent upon being run inside the Eclipse Che environment and having the keycloak user profile info.  

## Requirements

| Package | Version |
|---------|---------|
| JupyterLab | v4.1.6 |
| NodeJS | v18.20.0 |
| Python | >= v3.8 |

* s3fs-fuse
* corresponding dependencies and s3 configurations/permissions
* Eclipse Che stack/workspace must have 2 installers enabled to allow ssh-ing into the workspace:  
  * org.eclipse.che.exec
  * org.eclise.che.ssh

These are the recommended versions. Others may be suitable, but are not actively supported.
    
## Install

To install the extension, execute:

```bash
pip install maap-user-workspace-management-jupyter-extension
```
  
## Uninstall

To remove the extension, execute:

```bash
pip uninstall maap-user-workspace-management-jupyter-extension
```
  
## Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the user_workspace_management_jupyter_extension directory
# Install dependencies
jlpm install
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```
  
## Development uninstall

```bash
pip uninstall maap_user_workspace_management_jupyter_extension
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `maap-user-workspace-management-jupyter-extension` within that folder.

## Testing

Playwright is the testing framework used. When testing locally, use the following command to start the jupyter server and run the tests:
```
jlpm run start & jlpm run test
```

To test using the interactive UI, run the following instead:

```
jlpm run start & jlpm run test --ui
```
  
## Release

See [RELEASE](RELEASE.md)

## Contribute

See [CONTRIBUTING](CONTRIBUTING.md)