import { readFile, writeFile } from "node:fs/promises";

const MAX_SYMBOLS = 500000;
const TOKEN = "AIzaSyATBXajvzQLTDHEQbcpq0Ihe0vWDHmO520";
const BUFFER_FILENAME = process.argv[2] || "page.html";
const FROM_LANG = process.argv[3] || "ru";
const PIPELINE_LENGTH = Number(process.argv[4]) || 100;

const TRANSLATION_PIPELINE = [
    "zh-CN", // Simplified Chinese
    "ar",    // Arabic
    "ru",    // Russian
    "am",    // Amharic
    "ko",    // Korean
    "sw",    // Swahili
    "uk",    // Ukrainian
    "fr",    // French
    "ja",    // Japanese
    "es",    // Spanish
    "tr",    // Turkish
    "bn",    // Bengali
    "vi",    // Vietnamese
    "pl",    // Polish
    "fa",    // Persian (Farsi)
    "ta",    // Tamil
    "he",    // Hebrew
    "it",    // Italian
    "cs",    // Czech
    "pt",    // Portuguese
    "ml",    // Malayalam
    "sr",    // Serbian
    "id",    // Indonesian
    "hu",    // Hungarian
    "nl",    // Dutch
    "sv",    // Swedish
    "hi",    // Hindi
    "th",    // Thai
    "el",    // Greek
    "bg",    // Bulgarian
    "ro",    // Romanian
    "az",    // Azerbaijani
    "km",    // Khmer
    "my",    // Burmese
    "ur",    // Urdu
    "da",    // Danish
    "fi",    // Finnish
    "sk",    // Slovak
    "no",    // Norwegian
    "ca",    // Catalan
    "lt",    // Lithuanian
    "lv",    // Latvian
    "sl",    // Slovenian
    "gl",    // Galician
    "zu",    // Zulu
    "xh",    // Xhosa
    "tt",    // Tatar
    "mn",    // Mongolian
    "ga",    // Irish
    "haw",   // Hawaiian
    "sq",    // Albanian
    "hr",    // Croatian
    "mk",    // Macedonian
    "et",    // Estonian
    "ne",    // Nepali
    "la",    // Latin
    "is",    // Icelandic
    "cy",    // Welsh
    "tl",    // Tagalog
    "te",    // Telugu
    "pa",    // Punjabi
    "mr",    // Marathi
    "si",    // Sinhala
    "oc",    // Occitan
    "ka",    // Georgian
    "eu",    // Basque
    "hy",    // Armenian
    "bs",    // Bosnian
    "sr",    // Serbian
    "hr",    // Croatian
    "se",    // Swedish
    "zu",    // Zulu
    "la",    // Latin
    "ja",    // Japanese
    "el",    // Greek
    "zh",    // Chinese
    "ht",    // Haitian Creole
    "ky",    // Kyrgyz
    "sr",    // Serbian
    "sq",    // Albanian
    "lo",    // Lao
    "si",    // Sinhala
    "tk",    // Turkmen
    "rw",    // Kinyarwanda
    "so",    // Somali
    "haw",   // Hawaiian
    "jv",    // Javanese
    "haw",   // Hawaiian
    "ml",    // Malayalam
    "km",    // Khmer
    "lv",    // Latvian
    "be",    // Belarusian
    "ml",    // Malayalam
    "sq",    // Albanian
    "fi",    // Finnish
    "bs",    // Bosnian
    "pt",    // Portuguese
].slice(0, PIPELINE_LENGTH);

let html = (await readHtmlFromFile(BUFFER_FILENAME));
let prevLang = FROM_LANG;

try {
    TRANSLATION_PIPELINE.push(FROM_LANG)

    let langNo = 1;
    for (const lang of TRANSLATION_PIPELINE) {
        const chunks = splitIntoChunks(html, MAX_SYMBOLS);

        console.log(chunks.length > 1
            ? `${langNo}. ${prevLang} -> ${lang}: ${chunks.length} chunks`
            : `${langNo}. ${prevLang} -> ${lang}`);

        langNo++;

        const translationPromises = [];
        for (let i = 0; i < chunks.length; i++) {
            const translationPromise = googleTranslate(chunks[i], prevLang, lang, TOKEN);
            translationPromises.push(translationPromise);
        }

        html = (await Promise.all(translationPromises)).join("");
        prevLang = lang;
    }

    console.log(`${prevLang} -> ${FROM_LANG}`);
} catch (error) {
    console.log("Failed to translate, writing back what we have.", error);
}

writebackHtml(BUFFER_FILENAME, html);

async function googleTranslate(html, fromLang, toLang, token) {
    const response = await fetch("https://translate-pa.googleapis.com/v1/translateHtml", {
        headers: {
            "content-type": "application/json+protobuf",
            "x-goog-api-key": token,
        },
        method: "POST",
        body: JSON.stringify([[[html], fromLang, toLang], "wt_lib"]),
    });

    const decodedTranslation = (await response.json())[0][0];

    if (decodedTranslation === undefined) {
        throw new Error("Got nothing after a translation")
    }

    return decodedTranslation;
}

function splitIntoChunks(text, maxSymbols) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxSymbols) {
        chunks.push(text.slice(i, i + maxSymbols));
    }
    return chunks;
}

async function readHtmlFromFile(filename) {
    return readFile(filename, { encoding: "utf8" });
}

async function writebackHtml(filename, html) {
    await writeFile(filename, html, { flush: true });
}
