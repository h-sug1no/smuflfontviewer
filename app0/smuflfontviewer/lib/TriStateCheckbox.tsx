import React, { useState } from 'react';
import { Checkbox, CheckboxProps } from '@material-ui/core';

const isChecked = (value: number) => !!(value === 2);
const isIndeterminate = (value: number) => !!(value === 1);

export type ITriState = {
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  onInput: () => void;
};

export const useTriState = (val = 0): ITriState => {
  const [value, setValue] = useState<number>(val);

  const onInput = (/*e*/) => {
    let newVal = value + 1;
    if (newVal > 2) {
      newVal = 0;
    }
    setValue(newVal);
  };

  return {
    value,
    setValue,
    onInput,
  };
};

type IOnInput = (e: unknown) => void;
type ITriStateProps = CheckboxProps & {
  triOnInput: IOnInput;
  triValue: number;
};

const TriStateCheckbox = (props: ITriStateProps): JSX.Element => {
  const { triOnInput, triValue } = props;

  return (
    <Checkbox
      checked={isChecked(triValue)}
      indeterminate={isIndeterminate(triValue)}
      onInput={triOnInput}
    />
  );
};

export default TriStateCheckbox;
