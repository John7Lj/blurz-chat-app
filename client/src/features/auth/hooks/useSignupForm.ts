/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { SignupSchema } from '../../../types/auth.types';

export function useSignupForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldValue = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleBlur = (key: string) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    validateField(key);
  };

  const validateField = (key: string) => {
    const result = SignupSchema.safeParse(form);
    if (!result.success) {
      const fieldError = result.error.issues.find((e) => String(e.path[0]) === key);
      if (fieldError) {
        setFieldErrors((prev) => ({ ...prev, [key]: fieldError.message }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const result = SignupSchema.safeParse(form);
    const step1Fields = ['first_name', 'last_name', 'email'];
    const errors: Record<string, string> = {};

    if (!result.success) {
      for (const err of result.error.issues) {
        const field = String(err.path[0]);
        if (step1Fields.includes(field)) {
          errors[field] = err.message;
        }
      }
    }

    const newTouched: Record<string, boolean> = {};
    for (const f of step1Fields) newTouched[f] = true;
    setTouched((prev) => ({ ...prev, ...newTouched }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const f of step1Fields) {
        if (errors[f]) next[f] = errors[f];
        else delete next[f];
      }
      return next;
    });

    return Object.keys(errors).length === 0 &&
      form.first_name.trim() !== '' &&
      form.last_name.trim() !== '' &&
      form.email.trim() !== '';
  };

  const validateStep2 = (): boolean => {
    const result = SignupSchema.safeParse(form);
    const step2Fields = ['username', 'phone', 'password'];
    const errors: Record<string, string> = {};

    if (!result.success) {
      for (const err of result.error.issues) {
        const field = String(err.path[0]);
        if (step2Fields.includes(field)) {
          errors[field] = err.message;
        }
      }
    }

    const newTouched: Record<string, boolean> = {};
    for (const f of step2Fields) newTouched[f] = true;
    setTouched((prev) => ({ ...prev, ...newTouched }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const f of step2Fields) {
        if (errors[f]) next[f] = errors[f];
        else delete next[f];
      }
      return next;
    });

    return Object.keys(errors).length === 0;
  };

  const showError = (key: string) => touched[key] ? fieldErrors[key] : undefined;

  const inputErrorStyle = (key: string): React.CSSProperties =>
    touched[key] && fieldErrors[key]
      ? { borderColor: '#f87171', boxShadow: '0 0 0 1px rgba(248,113,113,0.3)' }
      : {};

  const isStep1Filled = form.first_name.trim() && form.last_name.trim() && form.email.trim();
  const isStep2Filled = form.username.trim() && form.phone.trim() && form.password.length >= 8;

  return {
    step,
    setStep,
    form,
    setFieldValue,
    handleBlur,
    validateStep1,
    validateStep2,
    showError,
    inputErrorStyle,
    isStep1Filled,
    isStep2Filled
  };
}
