import React, { useState } from 'react';
import { Checkbox, CheckboxProps } from '@material-ui/core';

const isChecked = (value: number) => !!(value === 2);
const isIndeterminate = (value: number) => !!(value === 1);

export enum TriValues {
  checked = 2,
  indeterminate = 1,
  initial = 0,
}

export type ITriState = {
  value: TriValues;
  setValue: React.Dispatch<React.SetStateAction<TriValues>>;
  onInput: (e: unknown, mode: string) => void;
};

export const useTriState = (val: TriValues = TriValues.initial): ITriState => {
  const [value, setValue] = useState<TriValues>(val);

  const onInput = (e: unknown, mode: string) => {
    let newVal = value ? TriValues.initial : TriValues.checked;
    if (mode === 'tri') {
      newVal = value + 1;
      if (newVal > TriValues.checked) {
        newVal = TriValues.initial;
      }
    }
    setValue(newVal);
  };

  return {
    value,
    setValue,
    onInput,
  };
};

type IOnInput = (e: unknown, mode: string) => void;
type ITriStateProps = CheckboxProps & {
  triOnInput: IOnInput;
  triValue?: number;
  mode?: string;
};

const TriStateCheckbox = (props: ITriStateProps): JSX.Element => {
  const { triOnInput, triValue = TriValues.initial, mode = 'tri' } = props;

  return (
    <Checkbox
      checked={isChecked(triValue)}
      indeterminate={isIndeterminate(triValue)}
      onInput={(e) => triOnInput(e, mode)}
    />
  );
};

export default TriStateCheckbox;
