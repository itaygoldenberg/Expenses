import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { TextField, type TextFieldProps } from './TextField'
import styles from './Field.module.css'

type Props = Omit<TextFieldProps, 'type' | 'endAdornment' | 'numeric'>

/** Password input with a show / hide toggle. */
export function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      dir="ltr"
      autoCapitalize="none"
      spellCheck={false}
      endAdornment={
        <button
          type="button"
          className={styles.eye}
          aria-label="הצגת הסיסמה"
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          disabled={props.disabled}
        >
          {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      }
    />
  )
}
