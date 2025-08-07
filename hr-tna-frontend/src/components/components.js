// components.js

import React from "react";

export const Card = ({ children }) => (
  <div className="shadow-lg p-6 bg-white rounded w-full">{children}</div>
);

export const CardContent = ({ children }) => <div className="p-4">{children}</div>;

export const Button = ({ children, type = "button", ...props }) => (
  <button className={`px-4 py-2 rounded bg-blue-600`} {...props}>
    {children}
  </button>
);

export const Select = ({ register, name, options, label }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">{label}</label>
    <select {...register(name)} className="w-full p-2 border rounded">
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const Input = ({ name, register, type = "text", label, placeholder, error }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      {label} {error && <span className="text-red-500">*</span>}
    </label>
    <input
      {...register(name)}
      type={type}
      className={`w-full p-2 border rounded ${error ? "border-red-500" : ""}`}
      placeholder={placeholder}
    />
    {error && <p className="text-red-500 text-sm">{error.message}</p>}
  </div>
);

export const TextArea = ({ register, name, label, placeholder }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">{label}</label>
    <textarea
      {...register(name)}
      className="w-full p-2 border rounded min-h-[100px]"
      placeholder={placeholder}
    />
  </div>
);

export const DynamicFieldSection = ({
  title,
  fields,
  onAdd,
  onRemove,
  register,
  fieldPath,
}) => {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-medium mt-4">{title}</h3>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2">
          <Input
            {...register(`${fieldPath}.${index}`)}
            placeholder={title}
            className="w-full"
          />
          <Button
            type="button"
            onClick={() => onRemove(index)}
            className="bg-red-600 hover:bg-red-700"
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={onAdd} className="bg-green-600 hover:bg-green-700">
        Add {title}
      </Button>
    </section>
  );
};