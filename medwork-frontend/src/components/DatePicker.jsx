import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { DATE_PICKER_LOCALE } from '../utils/datePicker'

/**
 * Unified DatePicker component that hides the placeholder text and fixes
 * label overlap issues, supporting both slotProps and direct top-level props.
 */
export function DatePicker({
  slotProps,
  size,
  error,
  helperText,
  fullWidth,
  required,
  format = 'dd/MM/yyyy',
  inputFormat,
  sx,
  ...props
}) {
  const finalFormat = inputFormat || format

  return (
    <DesktopDatePicker
      format={finalFormat}
      locale={DATE_PICKER_LOCALE}
      sx={sx}
      {...props}
      slotProps={{
        ...slotProps,
        textField: {
          size: size ?? slotProps?.textField?.size ?? 'small',
          error: error ?? slotProps?.textField?.error,
          helperText: helperText ?? slotProps?.textField?.helperText,
          fullWidth: fullWidth ?? slotProps?.textField?.fullWidth,
          required: required ?? slotProps?.textField?.required,
          InputLabelProps: { shrink: true, ...slotProps?.textField?.InputLabelProps },
          ...slotProps?.textField,
          placeholder: '',
          inputProps: {
            ...slotProps?.textField?.inputProps,
            placeholder: '',
          },
        },
      }}
    />
  )
}

export default DatePicker
