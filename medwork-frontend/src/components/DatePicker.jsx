import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { DATE_PICKER_LOCALE } from '../utils/datePicker'

/**
 * DatePicker component that hides the placeholder text.
 * Fixes the issue where "GG/MM/AAAA" placeholder overlaps with the label.
 */
export function DatePicker({ slotProps, ...props }) {
  return (
    <DesktopDatePicker
      {...props}
      locale={DATE_PICKER_LOCALE}
      InputLabelProps={{ shrink: true, ...props.InputLabelProps }}
      slotProps={{
        ...slotProps,
        textField: {
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
