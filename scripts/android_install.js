#!/usr/bin/env node

module.exports = function (context) {
    var path = context.requireCordovaModule('path'),
        fs = context.requireCordovaModule('fs'),
        shell = context.requireCordovaModule('shelljs'),
        projectRoot = context.opts.projectRoot,
        plugins = context.opts.plugins || [];

    var ConfigParser = null;
    try {
        ConfigParser = context.requireCordovaModule('cordova-common').ConfigParser;
    } catch (e) {
        // fallback
        ConfigParser = context.requireCordovaModule('cordova-lib/src/configparser/ConfigParser');
    }

    var config = new ConfigParser(path.join(context.opts.projectRoot, "config.xml")),
        packageName = config.android_packageName() || config.packageName();

    // replace dash (-) with underscore (_)
    packageName = packageName.replace(/-/g, "_");

    console.info("Running android-install.Hook: " + context.hook + ", Package: " + packageName + ", Path: " + projectRoot + ".");

    if (!packageName) {
        console.error("Package name could not be found!");
        return;
    }

    // android platform available?
    if (context.opts.cordova.platforms.indexOf("android") === -1) {
        console.info("Android platform has not been added.");
        return;
    }

    var targetDir = path.join(projectRoot, "platforms", "android", "app", "src", "main", "java", packageName.replace(/\./g, path.sep), "alipush");

    // create directory
    shell.mkdir('-p', targetDir);
    var filename = 'AliPushActivity.java';

    if (['after_plugin_install'].indexOf(context.hook) === -1) {
        try {
            fs.unlinkSync(path.join(targetDir, filename));
            shell.rm('-f', targetDir);
        } catch (err) { }
    } else {
        // sync the content
        fs.readFile(path.join(context.opts.plugin.dir, 'src', 'android', filename), { encoding: 'utf-8' }, function (err, data) {
            if (err) {
                throw err;
            }

            data = data.replace(/__PACKAGE_NAME__/gm, packageName);
            fs.writeFileSync(path.join(targetDir, filename), data);
        });
    }
};
