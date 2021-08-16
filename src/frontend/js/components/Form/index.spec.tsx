import { render } from '@testing-library/react';
import { TextField, TextareaField, SelectField, CheckboxField, RadioField } from '.';

describe('Field', () => {
  it('applies fieldClasses to form-field element', () => {
    const { container } = render(
      <TextField id="a-field" fieldClasses={['field-modifier--1', 'field-modifier--2']} />,
    );

    const $field = container.querySelector('.form-field.field-modifier--1.field-modifier--2');
    expect($field).not.toBeNull();
  });

  it('displays a message when there is one', () => {
    const { container } = render(<TextField id="a-field" message="a help text" />);

    const $fieldMessage = container.querySelector('.form-field .form-field__message');
    expect($fieldMessage).not.toBeNull();
    expect($fieldMessage).toHaveTextContent('a help text');

    const $fieldMessageIcon = $fieldMessage!.querySelector('svg use');
    expect($fieldMessageIcon?.getAttribute('href')).toEqual('#icon-info-rounded');
  });

  it('applies error class modifier when error is true', () => {
    const { container } = render(
      <TextField
        id="a-field"
        error
        message="an error message"
        fieldClasses={['field-modifier--1', 'field-modifier--2']}
      />,
    );

    const $field = container.querySelector('.form-field.field-modifier--1.field-modifier--2');
    expect($field).not.toBeNull();
    expect($field?.classList).toContain('form-field--error');

    const $fieldMessage = container.querySelector('.form-field .form-field__message');
    expect($fieldMessage).not.toBeNull();
    expect($fieldMessage).toHaveTextContent('an error message');

    const $fieldMessageIcon = $fieldMessage!.querySelector('svg use');
    expect($fieldMessageIcon?.getAttribute('href')).toEqual('#icon-warning');
  });
});

describe('TextField', () => {
  it('renders an input element', () => {
    const { container } = render(<TextField id="password" name="pwd" type="password" />);
    const $field = container.querySelector('p.form-field');
    const $input = $field?.querySelector('input.form-field__input');
    const $label = $field?.querySelector('label.form-field__label');

    expect($input).toHaveAttribute('id', 'password');
    expect($input).toHaveAttribute('name', 'pwd');
    expect($input).toHaveAttribute('type', 'password');

    expect($label).toBeNull();
  });

  it('renders an input element with its associated label', () => {
    const { container } = render(
      <TextField label="Date of birth" id="date" name="birthDate" type="date" />,
    );
    const $field = container.querySelector('p.form-field');
    const $input = $field?.querySelector('input.form-field__input');
    const $label = $field?.querySelector('label.form-field__label');

    expect($input).toHaveAttribute('id', 'date');
    expect($input).toHaveAttribute('name', 'birthDate');
    expect($input).toHaveAttribute('type', 'date');

    expect($label).not.toBeNull();
    expect($label).toHaveAttribute('for', 'date');
    expect($label).toHaveTextContent('Date of birth');
  });

  it('renders with error modifier if an error is provided', () => {
    const { container } = render(
      <TextField error id="required-field" name="required-field" required={true} />,
    );

    const $field = container.querySelector('p.form-field');
    expect($field?.classList).toContain('form-field--error');
  });
});

describe('TextareaField', () => {
  it('renders a textarea element', () => {
    const { container } = render(<TextareaField id="resume" name="resume" />);
    const $field = container.querySelector('p.form-field');
    const $textarea = $field?.querySelector('textarea.form-field__textarea');
    const $label = $field?.querySelector('label.form-field__label');

    expect($textarea).toHaveAttribute('id', 'resume');
    expect($textarea).toHaveAttribute('name', 'resume');

    expect($label).toBeNull();
  });

  it('renders a textarea element with its associated label', () => {
    const { container } = render(
      <TextareaField label="Your comment" id="comment" name="comment" />,
    );
    const $field = container.querySelector('p.form-field');
    const $textarea = $field?.querySelector('textarea.form-field__textarea');
    const $label = $field?.querySelector('label.form-field__label');

    expect($textarea).toHaveAttribute('id', 'comment');
    expect($textarea).toHaveAttribute('name', 'comment');

    expect($label).not.toBeNull();
    expect($label).toHaveAttribute('for', 'comment');
    expect($label).toHaveTextContent('Your comment');
  });

  it('renders with error modifier if an error is provided', () => {
    const { container } = render(
      <TextareaField error id="required-field" name="required-field" required={true} />,
    );

    const $field = container.querySelector('p.form-field');
    expect($field?.classList).toContain('form-field--error');
  });
});

describe('SelectField', () => {
  it('renders a select element', () => {
    const options = [
      {
        key: 'fr',
        value: 'fr',
        label: 'French',
      },
      {
        key: 'en',
        value: 'en',
        label: 'English',
      },
    ];

    const { container } = render(
      <SelectField id="language" name="language">
        {options.map((option) => (
          <option key={option.key} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>,
    );

    const $field = container.querySelector('p.form-field');
    const $select = $field?.querySelector('select.form-field__select-input');
    const [$option1, $option2] = $field!.querySelectorAll<HTMLOptionElement>(
      'select.form-field__select-input > option',
    )!;
    const $label = $field?.querySelector('label.form-field__label');

    expect($select).toHaveAttribute('id', 'language');
    expect($select).toHaveAttribute('name', 'language');
    expect($option1).toHaveAttribute('value', 'fr');
    expect($option1).toHaveTextContent('French');
    expect($option2).toHaveAttribute('value', 'en');
    expect($option2).toHaveTextContent('English');

    expect($label).toBeNull();
  });

  it('renders a select element with its associated label', () => {
    const options = [
      {
        key: 'city-paris',
        value: 'paris',
        label: 'Paris',
      },
      {
        key: 'city-london',
        value: 'london',
        label: 'London',
      },
    ];

    const { container } = render(
      <SelectField label="Cities" id="cities" name="cities">
        {options.map((option) => (
          <option key={option.key} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>,
    );

    const $field = container.querySelector('p.form-field');
    const $select = $field?.querySelector('select.form-field__select-input');
    const [$option1, $option2] = $field!.querySelectorAll<HTMLOptionElement>(
      'select.form-field__select-input > option',
    )!;
    const $label = $field?.querySelector('label.form-field__label');

    expect($select).toHaveAttribute('id', 'cities');
    expect($select).toHaveAttribute('name', 'cities');
    expect($option1).toHaveAttribute('value', 'paris');
    expect($option1).toHaveTextContent('Paris');
    expect($option2).toHaveAttribute('value', 'london');
    expect($option2).toHaveTextContent('London');

    expect($label).not.toBeNull();
    expect($label).toHaveAttribute('for', 'cities');
    expect($label).toHaveTextContent('Cities');
  });

  it('renders with error modifier if an error is provided', () => {
    const { container } = render(
      <SelectField error id="required-field" name="required-field" required={true}>
        <option value="option-1" key="option-1">
          Option 1
        </option>
      </SelectField>,
    );

    const $field = container.querySelector('p.form-field');
    expect($field?.classList).toContain('form-field--error');
  });
});

describe('CheckboxField', () => {
  it('renders a checkbox input element with its associated label', () => {
    const { container } = render(
      <CheckboxField label="I'm agree" id="agreement" name="agreement" />,
    );
    const $field = container.querySelector('p.form-field');
    const $input = $field?.querySelector('input.form-field__checkbox-input');
    const $label = $field?.querySelector('label.form-field__label');

    expect($input).toHaveAttribute('id', 'agreement');
    expect($input).toHaveAttribute('name', 'agreement');
    expect($input).toHaveAttribute('type', 'checkbox');

    expect($label).not.toBeNull();
    expect($label).toHaveAttribute('for', 'agreement');
    expect($label).toHaveTextContent("I'm agree");
  });

  it('renders with error modifier if an error is provided', () => {
    const { container } = render(
      <CheckboxField
        error
        id="required-field"
        label="Required field"
        name="required-field"
        required={true}
      />,
    );

    const $field = container.querySelector('p.form-field');
    expect($field?.classList).toContain('form-field--error');
  });
});

describe('RadioField', () => {
  it('renders a radio input element with its associated label', () => {
    const { container } = render(<RadioField label="I'm agree" id="agreement" name="agreement" />);
    const $field = container.querySelector('p.form-field');
    const $input = $field?.querySelector('input.form-field__radio-input');
    const $label = $field?.querySelector('label.form-field__label');

    expect($input).toHaveAttribute('id', 'agreement');
    expect($input).toHaveAttribute('name', 'agreement');
    expect($input).toHaveAttribute('type', 'radio');

    expect($label).not.toBeNull();
    expect($label).toHaveAttribute('for', 'agreement');
    expect($label).toHaveTextContent("I'm agree");
  });

  it('renders with error modifier if an error is provided', () => {
    const { container } = render(
      <RadioField
        error
        id="required-field"
        label="Required field"
        name="required-field"
        required={true}
      />,
    );

    const $field = container.querySelector('p.form-field');
    expect($field?.classList).toContain('form-field--error');
  });
});
