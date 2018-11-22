# Mautic Theme Skeleton

A skeleton for the Mautic theme with configured SCSS compiler, css inliner and minifier.

This repository might be use as good start for configuring theme development process as well as a tool for building 
more complicated pieces of emails (something which is hard to develop in Mautic's content editor).

It incorporates a bunch of standard tools like (pre-processor, css compressor, css inliner, etc) into building pipeline
which makes email layouting less painful (just a bit though ;)).

Currently it supports <u>e-mail themes only</u>.

You might also want to check [Advanced Templates Bundle](https://github.com/Logicify/mautic-advanced-templates-bundle) which greately extends e-mail building capabilities.

## Features

* **SCSS compiler** - you can use powerful [SCSS syntax](https://sass-lang.com/) and mixins
* **HEML** - a tool for building responsive emails. It also does a great job on embedding CSS\SCSS into html so you can 
  keep styles in separate files and forget about copy-and-paste approach. Check out [official site](https://heml.io/) for
  more information about HEML features and syntax. 
* **Minifier** - does compression of the resulting html files to optimize final email size.
* Allows to compile ready to upload Mautic theme. You can simply upload `zip` file via web interface.
* Allows to work on email content\snippets which are not a part of your theme leveraging all power of heml and scss. 
* Designed to support generation of multiple themes basing on the same source code base.
* Easy deployment for development purposes. Compiled theme could be automatically copied to corresponding mautic 
  folder so you can check result immediately.
* Automatic rebuild (watch) - no need to run compilation after each change. Script monitors changes to the source 
  code and re-compiles automatically.

## Requirements 

The only requirement for the workstation is installed NodeJS. If you haven't it yet consult with 
[official site](https://nodejs.org/en/) on installation instructions.

It is also assumed you already have an instance of [Mautic](https://www.mautic.org/) configured and deployed either locally (preferred) or on 
some remote machine.

## Getting ready to work

1. Download or fork/clone this repository
1. Open terminal and navigate to the project directory.
  **NOTE**: Keep project's folder **outside** of your Mautic folder.
1. Run `npm install` to download all dependencies 
1. **Optional** Open `package.json` and set property `mautic.mauticBasePath` to point location of the root of your Mautic 
  installation. This might be a relative path as well as absolute. You may skip this step, however automatic deployment
   and automatic rebuild features will not work in this case. 

## Usage

Please note, this repository doesn't contain any ready to use theme. It is just a bootstrap project (skeleton) for 
building your own. We will check a few typical usage scenarios. 

Please complete all steps from the **Getting ready to work** section prior starting any further activities described 
below. 

### Creating own email template

1. Edit section `mautic.themes` of the `package.json` file:
    * Set `name` to something without spaces and special characters. It will be used to name files and folders. 
    * Update `verboseName`. This is what you will see in the list of available themes in Moutic.    
2. Edit file `src/config.json` file:
    * Leave `name` empty
    * Update `author` and `authorUrl` fields
3. Feel you free to update files under `src/assets` and `src/heml` folders.
4. Build your theme with `npm run package`. Output should appear under `build/themes` directory.

### Building code snippets

If you liked this toolchain during theme creating you might be interested if it is possible to use the same for 
designing emails content which is not a part of the theme itself. 

Yes, it is possible with `compile` command:

1. Create a file for your code snippet under `src/emails` folder.
    **NOTE**: Make sure to use `.heml` as an extension. E.g. `welcome-email.heml`
2. Put your heml here, include css in needed.
3. Run `npm run compile -- --email FILE_NAME_WITHOUT_EXTENSION`. E.g. `npm run compile -- --email welcome-email`
    **NOTE**: Notice no file extension here.
4. Find your compiled snipet under `build/emails`. You can just copy the code and paste it in the Moutic's editor.    

### Maintaining multiple themes

In terms of Mautic theme provides just one single email template. However it is highly likely you need a couple of 
layouts with similar but slightly different look and feel. In that case you will need to create a few themes.

The problem here is obvious - if you copy this repository a few times you will need to support multiple code bases 
and also common part (e.g. styles, colors) will be cloned as well so you will need to incorporate changes\fixes in 
couple of places. 

In order to avoid this mess this tool allows you to build multiple Mautic themes from the unite code base. In this 
example we will create 2 themes: `my-theme-1` and `my-theme-2`:

1. Edit section `mautic.themes` of the `package.json` file:
  ```json
  "themes": [
    {
      "name": "my-theme-1",
      "verboseName": "My Theme 1",
      "emailTemplateFile": "email.my-theme-1.heml.twig"
    },
    {
      "name": "my-theme-2",
      "verboseName": "My Theme 2",
      "emailTemplateFile": "email.my-theme-2.heml.twig"
    }
  ]
  ```
  **IMPORTANT**: Name of the file should be in the format "email.**your-theme**.heml.twig" you are allowed to 
change bold part only. It is very important to follow this convention!
2. Copy `src/heml/email.deafult.heml.twig` two times to create `email.my-theme-1.heml.twig` and `email.my-theme-2
  .heml.twig`
3. Make content of those files slightly different to make sure we will compile 2 separate themes.
4. Run `npm run package` to compile both. You should get 2 zip files under `built\themes`.

### All CLI features (available commands)

| Command     | Description                              | Example                                  |
| ----------- | ---------------------------------------- | ---------------------------------------- |
| **build**   | Compiles all theme sources and writes result under `build\themes`. <br />Each theme will be in the separate folder. | `npm run build`                          |
| **package** | Compiles build and prepares ZIP archive (supported by Mautic) for each theme. | `npm run package`                        |
| **deploy**  | Builds themes and copies them to local Mautic directory.<br />This requires setting `mautic.mauticBasePath` to be set in `package.json`. | `npm run deploy`                         |
| **watch**   | Does automatic deploy each time you save any source code. Might be useful during development. | `npm run watch`                          |
| **compile** | Compiles one single code snippet. Requires `--email` argument. See section [Building code snippets](#building-code-snippets) for details.<br />Also please notice **extra** `--` in this command. | `npm run compile -- --email welcome-email` |

## Credits

Dmitry Berezovsky, Logicify ([http://logicify.com/](https://logicify.com/?utm_source=github&utm_campaign=mautic-theme-skeleton&utm_medium=opensource))

## License

This repository is licensed under MIT. This means you are free to use it even in commercial projects.

Please also keep in mind, the MIT license clearly explains that there is no warranty for this free software. 
Please see the included [LICENSE](LICENSE) file for details.
