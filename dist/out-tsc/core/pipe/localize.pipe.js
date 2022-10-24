import { __decorate, __metadata, __param } from "tslib";
import { Pipe, LOCALE_ID, Inject } from '@angular/core';
import { PSupportedLanguageCodes, PSupportedLocaleIds } from '@plano/shared/api/base/generated-types.ag';
import { getDictionaryEntry } from './localize.dictionary';
import { Config } from '../config';
import { LogService } from '../log.service';
/**
 * A Pipe to translate strings in our App while we are waiting for Angular 9 with Ivy i18n
 * Example usage:
 *   this.localize.transform(
 *     'Hello ${firstName} ${lastName} @ ${company}',
 *     { firstName: 'Nils' }, { lastName: 'Neumann' * }, { company: 'Dr. Plano' }
 *   );
 */
let LocalizePipe = class LocalizePipe {
    constructor(console, locale) {
        this.console = console;
        this.languageCode = Config.getLanguageCode(locale);
    }
    /**
     * Use this only for Tests
     */
    languageTestSetter(language) {
        if (language)
            this.languageCode = language;
        this.console.debug(`this.languageCode: ${this.languageCode}`);
    }
    /**
     * Use this only for Tests
     */
    languageTestGetter() {
        return this.languageCode;
    }
    /**
     * Takes a string, looks it up in our dictionary, returns the string in the users language.
     */
    translate(input) {
        // Get the translated string from the dictionary.
        const TRANSLATED = getDictionaryEntry(input, this.languageCode);
        // Is the returned string the same as the input? Then someone probably forgot to translate it.
        // It could be possible that string is equal in two languages. Thats why this is not considered an error but we warn
        // developers about it.
        if (TRANSLATED === '' || TRANSLATED === input) {
            if (Config.DEBUG && Config.APPLICATION_MODE !== 'TEST')
                this.console.warn(`»${input}« in localize.dictionary.ts is not translated yet.`);
            return input;
        }
        return TRANSLATED;
    }
    /**
     * Take the provided params and put them into the sentence where the param-fitting marker is.
     * Example: It takes 'Hallo ${thing}' and { thing: 'Welt' } and makes 'Hallo Welt'.
     */
    replaceMarkersWithProvidedParams(translatedInputString, params, logVarDiffs) {
        if (!params)
            return translatedInputString;
        let result = translatedInputString;
        for (const KEY of Object.keys(params)) {
            // Param has been provided, but marker is missing in string? This seems like some developer did a mistake.
            if (logVarDiffs && !translatedInputString.includes(`\$\{${KEY}\}`))
                this.console.warn(`Can’t find »\$\{${KEY}\}« in »${translatedInputString}«`);
            // Take the provided param and put it into the string.
            const VALUE = params[KEY];
            if (VALUE === null) {
                if (translatedInputString.includes(`\$\{${KEY}\}`)) {
                    this.console.error(`»${KEY}« is part of text »${translatedInputString}«, but the value of the marker is »null«`);
                }
                continue;
            }
            const regexString = `\\\$\\\{${KEY}\\\}`; // String will be e.g. '\$\{firstName\}'
            const regex = new RegExp(regexString, 'g');
            result = result.replace(new RegExp(regex, 'g'), VALUE);
        }
        return result;
    }
    validateIO(input, output, params) {
        // If params is set to false instead of an object, then its intended that the variable markers don’t get replaced
        if (params === false)
            return;
        const HAD_NO_VARIABLE_MARKERS = !input.match(/\${[^{}]*}/g);
        if (HAD_NO_VARIABLE_MARKERS)
            return;
        const MISSING_VARIABLE_MARKERS = output.match(/\${[^{}]*}/g);
        if (MISSING_VARIABLE_MARKERS) {
            for (const MARKER of MISSING_VARIABLE_MARKERS)
                this.console.warn(`Missing variable to replace »${MARKER}« in »${input}«. Output: »${output}«, Params: ${JSON.stringify(params)}`);
        }
        else {
            // this.console.log(`Everything is ok with ${output}`);
        }
    }
    /**
     * Translates segments
     *
     * @example
     * this.localize.transform('Shift');
     * @example
     * this.localize.transform('Hallo ${thing}', { thing: universe.planets[0].name });
     * @example
     * <p>{{ item.title | localize }}</p>
     */
    transform(inputString, 
    /**
     * Params that should be replaced in the input string.
     *
     * Example:
     * If inputString is 'Hallo ${thing}'
     * and the param is { thing: 'Welt' },
     * the output will be 'Hallo Welt'
     */
    params, logVarDiffs = true) {
        let stringTranslation;
        if (this.languageCode === PSupportedLanguageCodes.de) {
            // If target is german, then nothing needs to be translated.
            stringTranslation = inputString;
        }
        else {
            // Example: Translate 'Hallo ${thing}' into 'Hello ${thing}'
            stringTranslation = this.translate(inputString);
        }
        let result;
        // Example: Take { thing: 'World' } and put the value of `thing` into 'Hallo ${thing}' so it makes 'Hello World'
        if (params !== undefined && params !== false) {
            result = this.replaceMarkersWithProvidedParams(stringTranslation, params, logVarDiffs);
        }
        else {
            result = stringTranslation;
        }
        // Check if there seems to be anything wrong in the result.
        // TODO: This is probably dead code but i‘m not sure how to safely prove this.
        this.validateIO(inputString, result, params);
        return result;
    }
};
LocalizePipe = __decorate([
    Pipe({ name: 'localize' }),
    __param(1, Inject(LOCALE_ID)),
    __metadata("design:paramtypes", [LogService, String])
], LocalizePipe);
export { LocalizePipe };
//# sourceMappingURL=localize.pipe.js.map