import React, { useCallback, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import parse from 'autosuggest-highlight/parse';

import { Dict } from '../lib/SMuFLMetadata';

import { match } from './UCodepointSelect';

const filter = createFilterOptions<IRangeSelectOption>({
  /* limit: 10 */
});

export default function RangeSelect(props: any): JSX.Element {
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
          // no need to add new item.
          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        id="free-solo-with-text-demo"
        options={rangeSelectOptions}
        getOptionLabel={(option: any) => {
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
        groupBy={(option: IRangeSelectOption) => (option.series || '').toString()}
        /* agetOptionLabel={(option: IRangeSelectOption) => option.name} */
        // renderOption={(option: IRangeSelectOption) => option.name}
        style={{ width: 300 }}
        freeSolo
        renderInput={(params) => <TextField {...params} label="enter (r)ange" variant="outlined" />}
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

export type IRangeSelectOption = {
  inputValue?: string;
  series: string;
  value: string;
  codepoint: number;
  name: string;
};

const rangeSelectOptions: IRangeSelectOption[] = [];
const rangeSelectOptionsMap: Dict<IRangeSelectOption> = {};

export function registerRangeSelectOption(rangeStr: string, cpNumber: number) {
  let ret = null;
  const str = rangeStr.trim();
  if (!rangeSelectOptionsMap[str]) {
    const newItem = (rangeSelectOptionsMap[str] = {
      inputValue: rangeStr,
      name: `${str}`,
      value: `${str}`,
      codepoint: cpNumber,
      series: 'smufl range',
    });
    rangeSelectOptions.push(newItem);
  }
  ret = rangeSelectOptionsMap[str];
  return ret;
}

export function getrangeSelectOptionByValue(rangeStr: string): IRangeSelectOption | null {
  return rangeSelectOptionsMap[rangeStr];
}
