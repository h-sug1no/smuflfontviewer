import React, { useState } from 'react';
import { Checkbox, CheckboxProps } from '@material-ui/core';

const isChecked = (value: number) => !!(value === 2);
const isIndeterminate = (value: number) => !!(value === 1);

export const useTriState = (val: number) => {
  const [value, setValue] = useState<number>(0);

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
