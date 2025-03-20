#!/usr/bin/env node
import puzzles_en from '../data/puzzles_en.json' with {type: 'json'}
import * as fs from 'fs';
import * as child_process from "node:child_process";

const Config = {
    maxPuzzles: 500,
    clean: process.argv.some((arg)=>arg === '--clean')
}

console.log('Generate with config', Config);

/**@type {{id: number, solution: string}[]}*/
const puzzles = puzzles_en['puzzles'];
const puzzlesSorted = puzzles.sort(({id: idA}, {id: idB}) => idA - idB);
const puzzlesSample = puzzlesSorted.slice(0, Config.maxPuzzles);

//clean label assets, will later be filled by copying generated files
fs.rmSync('./label/asset/image', { recursive: true, force: true });
fs.mkdirSync('./label/asset/image');
fs.rmSync('./label/asset/metadata', { recursive: true, force: true });
fs.mkdirSync('./label/asset/metadata');

for (let {id} of puzzlesSample) {
    for (let i = 0; i < 4; i++) {
        const imagePath = `./data/fourpics-puzzle-images/en/_${id}_${i+1}.jpg`;
        const labelsPath = `./data/meta/_${id}_${i+1}.labels.json`;
        if(Config.clean || !fs.existsSync(labelsPath)) {
            const detectedLabels = child_process.execFileSync('gcloud', ['ml', 'vision', 'detect-labels', imagePath]);
            fs.writeFileSync(labelsPath, detectedLabels);
            console.log(`${labelsPath} created`);
        }
        const safeSearchPath = `./data/meta/_${id}_${i+1}.safesearch.json`;
        if(Config.clean || !fs.existsSync(safeSearchPath)) {
            const detectedSafeSearch = child_process.execFileSync('gcloud', ['ml', 'vision', 'detect-safe-search', imagePath]);
            fs.writeFileSync(safeSearchPath, detectedSafeSearch);
            console.log(`${safeSearchPath} created`);
        }

        fs.copyFileSync(labelsPath, `./public/asset/metadata/_${id}_${i+1}.labels.json`);
        fs.copyFileSync(safeSearchPath, `./public/asset/metadata/_${id}_${i+1}.safesearch.json`);
        fs.copyFileSync(imagePath, `./public/asset/image/_${id}_${i+1}.jpg`);
    }
}
fs.writeFileSync('./label/asset/puzzles_en_sample.json', JSON.stringify(puzzlesSample));