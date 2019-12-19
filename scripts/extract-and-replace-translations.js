"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs = __importStar(require("fs"));
var glob_1 = __importDefault(require("glob"));
var _ = __importStar(require("lodash"));
var path = __importStar(require("path"));
var nl_json_1 = __importDefault(require("../src/shared/translations/nl.json"));
var sortObject = require('sort-object-keys');
function getFormattedKey(filePath, key) {
    var fileKey = filePath
        .replace(/[\\\/]+/g, '/')
        .split('.')[0]
        .split(/[\\\/]/g)
        .map(function (part) { return _.kebabCase(part); })
        .join('/')
        .toLowerCase()
        .replace(/(^\/+|\/+$)/g, '')
        .trim();
    var formattedKey = _.kebabCase(key);
    return fileKey + "___" + formattedKey;
}
function getFormattedTranslation(translation) {
    return translation.trim().replace(/\t\t\t+/g, ' ');
}
var options = {
    ignore: '**/*.d.ts',
    cwd: path.join(__dirname, '../src')
};
glob_1["default"]('**/*.@(ts|tsx)', options, function (err, files) {
    if (err) {
        console.error('Failed to extract translations', err);
        return;
    }
    var newTranslations = {};
    // Find and extract translations, replace strings with translation keys
    files.forEach(function (relativeFilePath) {
        try {
            var absoluteFilePath = options.cwd + "/" + relativeFilePath;
            var content = fs.readFileSync(absoluteFilePath).toString();
            // Replace Trans objects
            content = content.replace(/<Trans( i18nKey="([^"]+)")?>([\s\S]*?)<\/Trans>/g, function (match, keyAttribute, key, translation) {
                var formattedKey = key;
                var formattedTranslation = getFormattedTranslation(translation);
                if (!key) {
                    // new Trans without a key
                    formattedKey = getFormattedKey(relativeFilePath, formattedTranslation);
                }
                newTranslations[formattedKey] = formattedTranslation;
                return "<Trans i18nKey=\"" + formattedKey + "\">" + formattedTranslation + "</Trans>";
            });
            // Replace t() functions ( including i18n.t() )
            content = content.replace(
            // Match char before t function to make sure it isn't part of a bigger function name, eg: sent()
            /([^a-zA-Z])t\(\s*'([\s\S]+?)'\s*\)/g, function (match, prefix, translation) {
                var formattedKey;
                var formattedTranslation = getFormattedTranslation(translation);
                if (formattedTranslation.includes('___')) {
                    formattedKey = formattedTranslation;
                }
                else {
                    formattedKey = getFormattedKey(relativeFilePath, formattedTranslation);
                }
                newTranslations[formattedKey] = formattedTranslation;
                return prefix + "t('" + formattedKey + "')";
            });
            fs.writeFileSync(absoluteFilePath, content);
        }
        catch (err) {
            console.error("Failed to find translations in file: " + relativeFilePath, err);
        }
    });
    // Compare existing translations to the new translations
    var oldTranslationKeys = _.keys(nl_json_1["default"]);
    var newTranslationKeys = _.keys(newTranslations);
    var addedTranslationKeys = _.without.apply(_, [newTranslationKeys].concat(oldTranslationKeys));
    var removedTranslationKeys = _.without.apply(_, [oldTranslationKeys].concat(newTranslationKeys));
    var existingTranslationKeys = _.intersection(newTranslationKeys, oldTranslationKeys);
    // Console log translations that were found in the json file but not in the code
    console.warn("The following translation keys were removed: \n\t" + removedTranslationKeys.join('\n\t'));
    // Combine the translations in the json with the freshly extracted translations from the code
    var combinedTranslations = {};
    existingTranslationKeys.forEach(function (key) { return (combinedTranslations[key] = nl_json_1["default"][key]); });
    addedTranslationKeys.forEach(function (key) { return (combinedTranslations[key] = newTranslations[key]); });
    fs.writeFileSync(__dirname.replace(/\\/g, '/') + "/../src/shared/translations/nl.json", JSON.stringify(sortObject(combinedTranslations), null, 2));
    var totalTranslations = existingTranslationKeys.length + addedTranslationKeys.length;
    console.log("Wrote " + totalTranslations + " src/shared/translations/nl.json file\n\t" + addedTranslationKeys.length + " translations added\n\t" + removedTranslationKeys.length + " translations deleted");
});
//# sourceMappingURL=extract-and-replace-translations.js.map