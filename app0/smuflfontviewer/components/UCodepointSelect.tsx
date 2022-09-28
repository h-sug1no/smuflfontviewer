/* eslint-disable no-use-before-define */
import React, { useCallback, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import parse from 'autosuggest-highlight/parse';
// import match from 'autosuggest-highlight/match';
/*
const defaultFilterOptions = createFilterOptions<string>();
const filterOptions = (options: string[], state: FilterOptionsState) =>
  defaultFilterOptions(options, state).slice(0, 100);
*/

import { Dict } from '../lib/SMuFLTypes';
// import { ContactsTwoTone } from '@mui/icons-material';
const filter = createFilterOptions<IUCSelectOption | string>({
  /* limit: 10 */
});

// https://github.com/moroshko/autosuggest-highlight/issues/5#issuecomment-392333344
export const match = (text: string, query: string): [number, number][] => {
  const results: [number, number][] = [];
  const trimmedQuery = query.trim().toLowerCase();
  const textLower = text.toLowerCase();
  const queryLength = trimmedQuery.length;
  let indexOf = textLower.indexOf(trimmedQuery);
  while (queryLength && indexOf > -1) {
    results.push([indexOf, indexOf + queryLength]);
    indexOf = textLower.indexOf(query, indexOf + queryLength);
  }
  return results;
};

type IOnChange = (v: IUCSelectOption | null) => boolean;
type IUCodepointSelectOptions = { onChange: IOnChange; value: IUCSelectOption | null | string };
export default function UCodepointSelect(props: IUCodepointSelectOptions): JSX.Element {
  // fixme: define type of values.
  // const [value, setValue] = React.useState<IUCSelectOption | null>(null);
  const { onChange, value } = props;
  const [tick, setTick] = React.useState<number>(0);
  const refTick = React.useRef<number>();
  const setValue = useCallback(
    (v) => {
      if (!onChange(v)) {
        setTick((refTick.current || 0) + 1);
      }
    },
    [onChange],
  );

  useEffect(() => {
    refTick.current = tick;
  });
  return (
    <>
      <Autocomplete
        value={value}
        onChange={(event, newValue: IUCSelectOption | null | string) => {
          // console.log(`onChange: ${JSON.stringify(newValue)}`);
          if (typeof newValue === 'string') {
            /*
          setValue({
            value: newValue,
            name: newValue,
            series: 'unknown new string',
          });
          */
            setValue(null);
          } else if (newValue && newValue.inputValue) {
            if (newValue.value) {
              setValue(newValue);
            } else {
              // Create a new value from the user input
              setValue({
                value: newValue.inputValue,
                name: newValue.inputValue,
                series: 'unknown input string',
              });
            }
          } else {
            setValue(newValue);
          }
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          // Suggest the creation of a new value
          if (params.inputValue !== '') {
            /*
          filtered.push({
            inputValue: params.inputValue,
            name: `Add "${params.inputValue}"`,
            value: `${params.inputValue}`,
            series: 'tmp...',
          });
          */

            let str = params.inputValue;
            str = str.toUpperCase();
            if (str.match(/^[A-F0-9]+$/)) {
              let cpNumber = NaN;
              try {
                cpNumber = parseInt(str, 16);
                // check cpNumber is valid unicode codepoint.
                String.fromCodePoint(cpNumber);
              } catch (e) {
                // RangeError: xxxxxxx is not a valid code point
                // console.log(e);
                return filtered;
              }
              if (isNaN(cpNumber)) {
                return filtered;
              }

              str = formatCodepointNumber(cpNumber);
              // console.log(`${str}: ${cpNumber}`);
              if (!ucSelectOptionsMap[str]) {
                ucSelectOptionsMap[str] = {
                  inputValue: params.inputValue,
                  name: `${str}`,
                  value: `${str}`,
                  series: 'codepoint',
                };
                ucSelectOptions.unshift(ucSelectOptionsMap[str]);
                filtered.unshift(ucSelectOptionsMap[str]);
              }
            }
          }

          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        id="range-select"
        options={ucSelectOptions}
        getOptionLabel={(option: IUCSelectOption | string) => {
          // Value selected with enter, right from the input
          if (typeof option === 'string') {
            return option;
          }
          // Add "xxx" option created dynamically
          if (option.inputValue) {
            // return option.inputValue;
          }
          // Regular option
          return option.name;
        }}
        groupBy={(option: IUCSelectOption | string) => {
          return typeof option === 'string' ? '' : (option.series || '').toString();
        }}
        /* agetOptionLabel={(option: IUCSelectOption) => option.name} */
        // renderOption={(option: IUCSelectOption) => option.name}
        style={{ width: 300 }}
        freeSolo
        renderInput={(params) => (
          <TextField {...params} label="glyphname or (c)odepoint" variant="outlined" />
        )}
        renderOption={(props, option, { inputValue }) => {
          const name = typeof option === 'string' ? option : option.name;
          const matches = match(name, inputValue);
          const parts = parse(name, matches);

          /*
        if (inputValue.length) {
          console.log(JSON.stringify(parts), inputValue);
        }
        */

          return (
            <li {...props}>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{ backgroundColor: part.highlight ? 'orange' : 'transparent' }}
                >
                  {part.text}
                </span>
              ))}
            </li>
          );
        }}
      />
      {/*JSON.stringify(value)*/}
    </>
  );
}

export type IUCSelectOption = {
  inputValue?: string;
  series: string;
  value: string;
  name: string;
  glyphname?: string; // for series: optionalGlyphs | glyphnames
};

let ucSelectOptions: IUCSelectOption[] = [];
const ucSelectOptionsMap: Dict<IUCSelectOption> = {};
const initUCodepointSelectOptions = (src: IUCSelectOption[]): void => {
  if (Object.keys(ucSelectOptionsMap).length) {
    // for hot reload on debugging?
    return;
  }
  ucSelectOptions = src;
  ucSelectOptions.forEach((v) => {
    if (!ucSelectOptionsMap[v.value]) {
      ucSelectOptionsMap[v.value] = v;
    } else {
      console.error(`ucSelectOptionsMap has key: ${v.value}`);
    }
  });
};

function registerUCSelectOption(cpStr = '') {
  let ret = null;
  let str = cpStr.toUpperCase();
  if (str.match(/^[A-F0-9]+$/)) {
    let cpNumber = NaN;
    try {
      cpNumber = parseInt(str, 16);
      // check cpNumber is valid unicode codepoint.
      String.fromCodePoint(cpNumber);
    } catch (e) {
      // RangeError: xxxxxxx is not a valid code point
      // console.log(e);
      return ret;
    }
    if (isNaN(cpNumber)) {
      return ret;
    }

    str = formatCodepointNumber(cpNumber);
    // console.log(`${str}: ${cpNumber}`);
    if (!ucSelectOptionsMap[str]) {
      ucSelectOptionsMap[str] = {
        inputValue: cpStr,
        name: `${str}`,
        value: `${str}`,
        series: 'codepoint',
      };
    }
    ret = ucSelectOptionsMap[str];
  }
  return ret;
}

export function getUCSelectOptionByValue(cpStr: string): IUCSelectOption | null {
  // TODO: check cpValue is codepoint then add to Map then return it.
  return registerUCSelectOption(cpStr);
}

export function formatCodepointNumber(codepointNumber: number): string {
  let str = 'NaN';
  if (isNaN(codepointNumber)) {
    return str;
  }

  str = codepointNumber.toString(16).toUpperCase();
  return str.padStart(4, '0');
}

export function IUCSelectOption_value2Number(value: string): number {
  return parseInt(value, 16);
}

export { initUCodepointSelectOptions };
