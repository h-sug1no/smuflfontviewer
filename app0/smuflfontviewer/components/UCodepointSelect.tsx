/* eslint-disable no-use-before-define */
import React, { useCallback, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import parse from 'autosuggest-highlight/parse';
// import match from 'autosuggest-highlight/match';
/*
const defaultFilterOptions = createFilterOptions<string>();
const filterOptions = (options: string[], state: FilterOptionsState) =>
  defaultFilterOptions(options, state).slice(0, 100);
*/

import { Dict } from '../lib/SMuFLMetadata';
// import { ContactsTwoTone } from '@material-ui/icons';
const filter = createFilterOptions<IUCSelectOption>({
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

export default function UCodepointSelect(props: any): JSX.Element {
  const { onChange, value } = props;
  // fixme: define type of values.
  // const [value, setValue] = React.useState<IUCSelectOption | null>(null);

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
        onChange={(event, newValue: any) => {
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
        id="free-solo-with-text-demo"
        options={ucSelectOptions}
        getOptionLabel={(option: any) => {
          // Value selected with enter, right from the input
          if (typeof option === 'string') {
            return option;
          }
          // Add "xxx" option created dynamically
          if (option.inputValue) {
            return option.inputValue;
          }
          // Regular option
          return option.name;
        }}
        groupBy={(option: IUCSelectOption) => (option.series || '').toString()}
        /* agetOptionLabel={(option: IUCSelectOption) => option.name} */
        // renderOption={(option: IUCSelectOption) => option.name}
        style={{ width: 300 }}
        freeSolo
        renderInput={(params) => (
          <TextField {...params} label="glyphname or (c)odepoint" variant="outlined" />
        )}
        renderOption={(option, { inputValue }) => {
          const matches = match(option.name, inputValue);
          const parts = parse(option.name, matches);

          /*
          if (inputValue.length) {
            console.log(JSON.stringify(parts), inputValue);
          }
          */

          return (
            <div>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{ backgroundColor: part.highlight ? 'orange' : 'transparent' }}
                >
                  {part.text}
                </span>
              ))}
            </div>
          );
        }}
      />
      {JSON.stringify(value)}
    </>
  );
}

export type IUCSelectOption = {
  inputValue?: string;
  series: string;
  value: string;
  name: string;
};

let ucSelectOptions: IUCSelectOption[] = [];
const ucSelectOptionsMap: Dict<IUCSelectOption> = {};
const initUCodepointSelectOptions = (src: IUCSelectOption[]): void => {
  ucSelectOptions = src;
  ucSelectOptions.forEach((v) => {
    if (!ucSelectOptionsMap[v.value]) {
      ucSelectOptionsMap[v.value] = v;
    } else {
      console.error(`ucSelectOptionsMap has key: ${v.value}`);
    }
  });
};

function formatCodepointNumber(codepointNumber: number) {
  let str = 'NaN';
  if (isNaN(codepointNumber)) {
    return str;
  }

  str = codepointNumber.toString(16).toUpperCase();
  return str.padStart(4, '0');
}

/*
function getCodepointNumber(cpStr: string) {
  return Number('0x' + (cpStr || getCodepoint()), 16);
}
*/

export { initUCodepointSelectOptions };
