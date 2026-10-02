'use client';

import {useState, useCallback, useEffect} from 'react';
import {GlassDropdown} from './GlassDropdown';
import {useRouter} from 'next/navigation';
import {createComplaint} from '@/services/complaint';
import {getActiveCategories} from '@/services/categories';
import {errorMessage} from '@/lib/utils';

interface FormValues {
  student_name: string;
  roll_number: string;
  department: string;
  class_division: string;
  contact_number: string;
  gmail_id: string;
  category: string;
  custom_category: string;
  pc_number: string;
  description: string;
}

interface FieldError {
  key: string;
  message: string;
}

export function RaiseComplaintForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    student_name: '',
    roll_number: '',
    department: '',
    class_division: '',
    contact_number: '',
    gmail_id: '',
    category: '',
    custom_category: '',
    pc_number: '',
    description: '',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingC, setLoadingC] = useState(true);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = useCallback(
    (key: keyof FormValues, value: string) => {
      setValues((v) => ({...v, [key]: value}));
      setErrors((e) => e.filter((x) => x.key !== key));
      setSubmitError(null);
    },
    [],
  );

  useEffect(() => {
    getActiveCategories()
      .then((cats) => {
        setCategories(cats);
        setLoadingC(false);
      })
      .catch(() => setLoadingC(false));
  }, []);

  const validate = (): FieldError[] => {
    const errs: FieldError[] = [];
    if (!values.student_name.trim()) errs.push({key: 'student_name', message: 'Student name is required'});
    if (!values.roll_number.trim()) errs.push({key: 'roll_number', message: 'Roll Number is required'});
    if (!values.department.trim()) errs.push({key: 'department', message: 'Department is required'});
    if (!values.class_division.trim()) errs.push({key: 'class_division', message: 'Class / Division is required'});
    if (!values.contact_number.trim()) errs.push({key: 'contact_number', message: 'Contact number is required'});
    else if (!/^\d{10}$/.test(values.contact_number.replace(/[\-\s]/g, '')))
      errs.push({key: 'contact_number', message: 'Enter a valid 10-digit Indian mobile number'});
    if (!values.gmail_id.trim()) errs.push({key: 'gmail_id', message: 'Gmail ID is required'});
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.gmail_id.trim())) {
      errs.push({key: 'gmail_id', message: 'Enter a valid email address'});
    } else if (!values.gmail_id.trim().toLowerCase().endsWith('@gmail.com')) {
      errs.push({key: 'gmail_id', message: 'Please use a Gmail address'});
    }
    if (!values.category) errs.push({key: 'category', message: 'Select a complaint category'});
    if (values.category === 'Other' && !values.custom_category.trim()) errs.push({key: 'custom_category', message: 'Enter complaint category'});
    if (!values.description.trim()) errs.push({key: 'description', message: 'Describe the issue'});
    else if (values.description.trim().length < 8) errs.push({key: 'description', message: 'Description must be at least 8 characters'});
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const finalCategory = values.category === 'Other' ? (values.custom_category || 'Other').trim() : values.category;
      const complaint = await createComplaint({
        student_name: values.student_name.trim(),
        roll_number: values.roll_number.trim(),
        department: values.department.trim(),
        class_division: values.class_division.trim(),
        contact_number: values.contact_number.trim(),
        gmail_id: values.gmail_id.trim(),
        category: finalCategory,
        pc_number: values.pc_number.trim() || undefined,
        description: values.description.trim(),
      });          router.push(
            `/raise/success?complaint_number=${encodeURIComponent(complaint.complaint_number)}` +
              `&status=${encodeURIComponent(complaint.status)}` +
              `&description=${encodeURIComponent(complaint.description.slice(0, 200))}`,
          );
    } catch (err: unknown) {
      setSubmitError(errorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Student Name"
          name="student_name"
          value={values.student_name}
          onChange={(v) => update('student_name', v)}
          error={errors.find((e) => e.key === 'student_name')?.message}
          autoComplete="name"
          glass
        />
        <Field
          label="Roll Number"
          name="roll_number"
          value={values.roll_number}
          onChange={(v) => update('roll_number', v)}
          error={errors.find((e) => e.key === 'roll_number')?.message}
          autoComplete="username"
          glass
        />
        <Field
          label="Department"
          name="department"
          value={values.department}
          onChange={(v) => update('department', v)}
          error={errors.find((e) => e.key === 'department')?.message}
          placeholder="e.g. Computer Science"
          glass
        />
        <Field
          label="Class / Division"
          name="class_division"
          value={values.class_division}
          onChange={(v) => update('class_division', v)}
          error={errors.find((e) => e.key === 'class_division')?.message}
          placeholder="e.g. SYCS-A"
          glass
        />
        <Field
          label="Contact Number"
          name="contact_number"
          type="tel"
          value={values.contact_number}
          onChange={(v) => update('contact_number', v)}
          error={errors.find((e) => e.key === 'contact_number')?.message}
          placeholder="98765 43210"
          autoComplete="tel"
          glass
        />
        <Field
          label="Gmail ID"
          name="gmail_id"
          type="email"
          value={values.gmail_id}
          onChange={(v) => update('gmail_id', v)}
          error={errors.find((e) => e.key === 'gmail_id')?.message}
          placeholder="name@gmail.com"
          autoComplete="email"
          glass
        />
        <div className="space-y-1">
          <GlassDropdown
            label="Complaint Category"
            options={categories}
            value={values.category}
            onChange={(v) => update('category', v)}
            placeholder="Select category"
            error={errors.find((e) => e.key === 'category')?.message}
            loading={loadingC}
          />
        </div>
      </div>

      {values.category === 'Other' && (
        <div className="space-y-1">            <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}}>Enter Complaint Category</label>
            <input
              className={`w-full rounded-lg border ${errors.find((e) => e.key === 'custom_category') ? 'border-red-500' : 'border-white/20'} px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/50`}
              style={{
                background: errors.find((e) => e.key === 'custom_category') ? undefined : 'rgba(255,255,255,0.05)',
                color: errors.find((e) => e.key === 'custom_category') ? undefined : '#ffffff',
              }}
              value={values.custom_category}
              onChange={(e) => update('custom_category', e.target.value)}
              placeholder="e.g. Lift / Elevator"
            />

          {errors.find((e) => e.key === 'custom_category') && (
            <p className="mt-1 text-xs text-red-600">{errors.find((e) => e.key === 'custom_category')?.message}</p>
          )}
        </div>
      )}

      {['Computer / PC', 'Laboratory Equipment', 'Internet / Wi-Fi'].includes(values.category) && (
        <div className="space-y-1">            <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}}>PC Number</label>
            <input
              className={`w-full rounded-lg border ${errors.find((e) => e.key === 'pc_number') ? 'border-red-500' : 'border-white/20'} px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/50`}
              style={{
                background: errors.find((e) => e.key === 'pc_number') ? undefined : 'rgba(255,255,255,0.05)',
                color: errors.find((e) => e.key === 'pc_number') ? undefined : '#ffffff',
              }}
              value={values.pc_number}
              onChange={(e) => update('pc_number', e.target.value)}
              placeholder="e.g. PC-17"
            />

        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor="description">
          Complaint Description
        </label>
        <textarea
          id="description"
          required
          className={`min-h-[120px] resize-y rounded-lg border ${errors.find((e) => e.key === 'description') ? 'border-red-500' : 'border-white/20'} px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/50`}
          style={{
            background: errors.find((e) => e.key === 'description') ? undefined : 'rgba(255,255,255,0.05)',
            color: errors.find((e) => e.key === 'description') ? undefined : '#ffffff',
            minHeight: '120px',
          }}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe your complaint clearly..."
        />
        {errors.find((e) => e.key === 'description') && (
          <p className="mt-1 text-xs text-red-600">{errors.find((e) => e.key === 'description')?.message}</p>
        )}
      </div>

      <p className="text-xs text-white/60">
        Priority is assigned automatically by the system and is not shown here.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className={`flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${submitting ? 'cursor-not-allowed bg-slate-400 shadow-none' : 'hover:bg-primary-dark hover:shadow-md'}`}
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Submit Complaint
          </>
        )}
      </button>

      {submitError && (
        <div className="rounded-lg border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  glass = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  glass?: boolean;
}) {
  const inputStyle: React.CSSProperties = glass
    ? {background: 'rgba(255,255,255,0.08)', color: '#ffffff'}
    : {};
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{color: 'rgba(255,255,255,0.9)'}} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-white/20'} px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder-white/50`}
        style={{
          background: error ? undefined : (glass ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'),
          color: error ? undefined : '#ffffff',
          ...(glass && {background: 'rgba(255,255,255,0.08)'}),
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
