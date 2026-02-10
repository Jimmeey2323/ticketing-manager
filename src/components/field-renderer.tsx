/**
 * Field Renderer - Dynamically render form fields based on field type and configuration
 * Handles all field types: text, select, textarea, checkbox, radio, date, etc.
 */

import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { X, AlertCircle, Check } from "lucide-react";

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "select"
  | "multi-select"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime"
  | "file"
  | "tags";

export interface DynamicFieldConfig {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
  defaultValue?: any;
  hint?: string;
  error?: string;
  className?: string;
}

interface FieldRendererProps {
  field: DynamicFieldConfig;
  fieldName: string;
  isLoading?: boolean;
  onValidate?: (value: any) => Promise<string | null>;
}

/**
 * FieldRenderer - Main component that selects and renders appropriate field type
 */
export function FieldRenderer({
  field,
  fieldName,
  isLoading = false,
  onValidate,
}: FieldRendererProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[fieldName];

  if (field.hidden) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <FormField
        control={control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {field.hint && (
                <span className="text-xs text-muted-foreground">({field.hint})</span>
              )}
            </FormLabel>

            <FormControl>
              <FieldComponentWrapper
                field={field}
                formField={formField}
                isLoading={isLoading}
              />
            </FormControl>

            {field.description && (
              <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <FormMessage className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error.message}
                </FormMessage>
              </motion.div>
            )}
          </FormItem>
        )}
      />
    </motion.div>
  );
}

/**
 * FieldComponentWrapper - Select and render appropriate field component
 */
interface FieldComponentWrapperProps {
  field: DynamicFieldConfig;
  formField: any;
  isLoading?: boolean;
}

function FieldComponentWrapper({
  field,
  formField,
  isLoading = false,
}: FieldComponentWrapperProps) {
  const props = {
    ...formField,
    disabled: isLoading || field.disabled,
    placeholder: field.placeholder,
  };

  switch (field.type) {
    case "text":
      return <TextInput {...props} />;

    case "email":
      return <EmailInput {...props} />;

    case "phone":
      return <PhoneInput {...props} />;

    case "number":
      return <NumberInput {...props} />;

    case "textarea":
      return <TextAreaInput {...props} minRows={4} />;

    case "select":
      return <SelectInput {...props} options={field.options || []} />;

    case "multi-select":
      return <MultiSelectInput {...props} options={field.options || []} />;

    case "checkbox":
      return <CheckboxInput {...props} label={field.label} />;

    case "radio":
      return <RadioInput {...props} options={field.options || []} />;

    case "date":
      return <DateInput {...props} />;

    case "datetime":
      return <DateTimeInput {...props} />;

    case "tags":
      return <TagsInput {...props} />;

    case "file":
      return <FileInput {...props} />;

    default:
      return <TextInput {...props} />;
  }
}

// ============================================
// Individual Field Components
// ============================================

function TextInput(props: any) {
  return (
    <Input
      type="text"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

function EmailInput(props: any) {
  return (
    <Input
      type="email"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

function PhoneInput(props: any) {
  return (
    <Input
      type="tel"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

function NumberInput(props: any) {
  return (
    <Input
      type="number"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

interface TextAreaInputProps {
  minRows?: number;
  [key: string]: any;
}

function TextAreaInput({ minRows = 4, ...props }: TextAreaInputProps) {
  return (
    <Textarea
      {...props}
      rows={minRows}
      className="rounded-lg border-1.5 resize-none"
    />
  );
}

interface SelectInputProps {
  options: Array<{ label: string; value: string }>;
  [key: string]: any;
}

function SelectInput({ options, ...props }: SelectInputProps) {
  return (
    <Select value={props.value || ""} onValueChange={props.onChange}>
      <SelectTrigger className="rounded-lg border-1.5">
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface MultiSelectInputProps {
  options: Array<{ label: string; value: string }>;
  [key: string]: any;
}

function MultiSelectInput({ options, ...props }: MultiSelectInputProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(props.value || []);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newValues);
    props.onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedValues.map((value) => {
          const option = options.find((o) => o.value === value);
          return (
            <Badge key={value} variant="secondary" className="gap-1">
              {option?.label}
              <button
                onClick={() => handleToggle(value)}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted"
          >
            <Checkbox
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface CheckboxInputProps {
  label: string;
  [key: string]: any;
}

function CheckboxInput({ label, ...props }: CheckboxInputProps) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <Checkbox
        checked={props.value}
        onCheckedChange={props.onChange}
        disabled={props.disabled}
      />
      <Label className="cursor-pointer">{label}</Label>
    </div>
  );
}

interface RadioInputProps {
  options: Array<{ label: string; value: string }>;
  [key: string]: any;
}

function RadioInput({ options, ...props }: RadioInputProps) {
  return (
    <RadioGroup value={props.value || ""} onValueChange={props.onChange}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem value={option.value} id={option.value} />
          <Label htmlFor={option.value} className="cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function DateInput(props: any) {
  return (
    <Input
      type="date"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

function DateTimeInput(props: any) {
  return (
    <Input
      type="datetime-local"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

interface TagsInputProps {
  [key: string]: any;
}

function TagsInput({ ...props }: TagsInputProps) {
  const [tags, setTags] = React.useState<string[]>(props.value || []);
  const [inputValue, setInputValue] = React.useState("");

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      const newTags = [...tags, tag.trim()];
      setTags(newTags);
      props.onChange(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    props.onChange(newTags);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:opacity-70"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Add tag and press Enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag(inputValue);
            }
          }}
          className="rounded-lg border-1.5"
          disabled={props.disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddTag(inputValue)}
          disabled={!inputValue.trim() || props.disabled}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function FileInput(props: any) {
  return (
    <Input
      type="file"
      {...props}
      className="rounded-lg border-1.5"
    />
  );
}

export default FieldRenderer;
