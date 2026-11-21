'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@dashboard/lib/form-context';
import { TextField } from '@dashboard/components/forms/fields/text-field';
import { TextareaField } from '@dashboard/components/forms/fields/textarea-field';
import { SelectField } from '@dashboard/components/forms/fields/select-field';
import { CheckboxField } from '@dashboard/components/forms/fields/checkbox-field';
import { SwitchField } from '@dashboard/components/forms/fields/switch-field';
import { RadioGroupField } from '@dashboard/components/forms/fields/radio-group-field';
import { SliderField } from '@dashboard/components/forms/fields/slider-field';
import { ComboboxField } from '@dashboard/components/forms/fields/combobox-field';
import { DatePickerField, DateRangeField } from '@dashboard/components/forms/fields/date-picker-field';
import { OtpField } from '@dashboard/components/forms/fields/otp-field';
import { ColorField } from '@dashboard/components/forms/fields/color-field';
import { FileUploadField } from '@dashboard/components/forms/fields/file-upload-field';
import { CheckboxGroupField } from '@dashboard/components/forms/fields/checkbox-group-field';
import { TagsField } from '@dashboard/components/forms/fields/tags-field';
import { ToggleGroupField } from '@dashboard/components/forms/fields/toggle-group-field';
import { SubmitButton } from '@dashboard/components/forms/submit-button';

/**
 * App-wide form hook — TanStack's createFormHook with the field components
 * registered. Fields render inside `form.AppField`:
 *
 * ```tsx
 * const form = useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit });
 *
 * <form.AppField name='email'
 *   children={(field) => <field.TextField label='Email' type='email' />} />
 * ```
 *
 * Every component's markup is the shadcn TanStack Form doc anatomy — for
 * one-off custom fields, drop down to the raw `form.Field` render prop and
 * compose the `Field` primitives directly (see docs/forms.md).
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    SelectField,
    CheckboxField,
    SwitchField,
    RadioGroupField,
    SliderField,
    ComboboxField,
    DatePickerField,
    DateRangeField,
    OtpField,
    ColorField,
    FileUploadField,
    CheckboxGroupField,
    TagsField,
    ToggleGroupField
  },
  formComponents: {
    SubmitButton
  }
});
