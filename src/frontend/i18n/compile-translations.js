#! /usr/bin/env node
const path = require('path');
const fs = require('fs');
const yargs = require('yargs');
const { glob } = require('glob');
const { merge } = require('cljs-merge');

/**
 * compile-translations
 * 
 * formatjs/cli compile and compile-folder methods do not allow merge.
 * So we need your own compile method.
 * 
 * Without specify option, this script compile all translations files includes
 * in i18n/locales into js/translations
 * 
 * You can provide a search pattern to include other translation sources. If several files have the
 * same name, they will be merged.
 * 
 * Usage: ./compile-translations.js [search_patterns] [--ignore] [--outDir <path_to_output_files]
 * 
 * 
 * ARGUMENTS:
 *  search_pattern      list of patterns to search additional translation files (support only json)
 *  --ignore            a pattern to ignore a path where search files (e.g ./node_modules)
 *  --outDir            output directory
 * 
 */


// Transparently includes Richie default translation files to lighten command
const LOCALES_PATTERN = path.resolve(__dirname, `./locales/*.json`);
// Output directory
const OUT_DIR = yargs.argv.outDir || path.resolve(__dirname, `../js/translations`);


(async () => {
  const { ignore, _: patterns } = yargs.argv
  const filesPattern = [
    LOCALES_PATTERN,
    ...patterns.map((filepath) => path.resolve(process.cwd(), filepath))
  ];

  // Search files and group paths found by filename
  const files = await glob(filesPattern, { nodir: true, ignore }, (error) => {
      if (error) throw new Error(error);
  }).then((matches) => matches.flat().reduce((outputs, filePath) => {
    const matchCutter = /.*\/(?<filename>.*)\.(?<ext>.{2,4})$/;
    const [, filename, ext] = filePath.match(matchCutter);
    if (ext !== 'json') throw new Error('Only JSON files are supported!');

    if (filename in outputs) {
      return {
        ...outputs,
        [filename]: [...outputs[filename], filePath]
      }
    }

    return {
      ...outputs,
      [filename]: [filePath],
    }
  }, {}));

  Object.entries(files).forEach(([filename, paths]) => {
    // Get file content
    const jsons = paths.map((filePath) => require(path.join(filePath)));
    let translations = jsons.shift();

    // If a translation contains several objects, we merged them
    if (jsons.length > 0) {
      translations = jsons.reduce((src, target) => {
        return merge({ src, target });
      }, translations);
    }

    // Write json files into output directory with format required by react-intl
    fs.writeFile(
      path.join(OUT_DIR, `${filename}.json`),
      JSON.stringify(Object.entries(translations).reduce((acc, [key, { message }]) => ({ ...acc, [key]: message }), {})),
      (error) => { if (error) throw new Error(error) }
    );
  })
})();
