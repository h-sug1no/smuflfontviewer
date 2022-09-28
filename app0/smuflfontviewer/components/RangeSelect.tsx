import React, { useCallback, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import parse from 'autosuggest-highlight/parse';

import { Dict } from '../lib/SMuFLTypes';

import { match } from './UCodepointSelect';

const filter = createFilterOptions<IRangeSelectOption | string>({
  /* limit: 10 */
});

export type RangeSelectProps = {
  onChange(value: IRangeSelectOption): boolean;
  value: string | IRangeSelectOption | null;
};

export default function RangeSelect(props: RangeSelectProps): JSX.Element {
  const { onChange, value } = props;
  // fixme: define type of values.
  // const [value, setValue] = React.useState<IRangeSelectOption | null>(null);

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
        onChange={(event, newValue: string | IRangeSelectOption | null) => {
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
          // no need to add new item.
          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        id="ucodepoint-select"
        options={rangeSelectOptions}
        getOptionLabel={(option: IRangeSelectOption | string) => {
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
        groupBy={(option: IRangeSelectOption | string) => {
          return typeof option === 'string' ? '' : (option.series || '').toString();
        }}
        /* agetOptionLabel={(option: IRangeSelectOption) => option.name} */
        // renderOption={(option: IRangeSelectOption) => option.name}
        style={{ width: 300 }}
        freeSolo
        renderInput={(params) => <TextField {...params} label="enter (r)ange" variant="outlined" />}
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

export type IRangeSelectOption = {
  inputValue?: string;
  series: string;
  value: string;
  codepoint: number;
  name: string;
};

const rangeSelectOptions: IRangeSelectOption[] = [];
const rangeSelectOptionsMap: Dict<IRangeSelectOption> = {};

const strCompare = (s1: string, s2: string): number => {
  let ret = 0;
  if (s1 > s2) {
    ret = 1;
  } else if (s1 < s2) {
    ret = -1;
  }
  return ret;
};

export const sortRangeSelectOptions = () => {
  rangeSelectOptions.sort((a, b) => {
    let ret = strCompare(a.series, b.series);
    if (!ret) {
      ret = strCompare(a.name, b.name);
    }
    return ret;
  });
};

const str2key = (str: string) => str.trim();
export function registerRangeSelectOption(
  rangeStr: string,
  cpNumber: number,
  series?: string,
): IRangeSelectOption {
  const str = str2key(rangeStr);
  if (!rangeSelectOptionsMap[str]) {
    const newItem = (rangeSelectOptionsMap[str] = {
      inputValue: rangeStr,
      name: `${str}`,
      value: `${str}`,
      codepoint: cpNumber,
      series: series || 'smufl range',
    });
    rangeSelectOptions.push(newItem);
  }
  const ret = rangeSelectOptionsMap[str];
  return ret;
}

export function getRangeSelectOptionByValue(rangeStr: string): IRangeSelectOption | null {
  return rangeSelectOptionsMap[str2key(rangeStr)];
}
