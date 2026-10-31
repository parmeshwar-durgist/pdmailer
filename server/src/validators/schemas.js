const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  email: z.string().email('Valid email is required').max(191),
  phone: z.string().max(50).optional().nullable(),
  title: z.string().max(150).optional().nullable(),
  company: z.string().max(150).optional().nullable()
});

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(150),
  subject: z.string().min(1, 'Email subject is required').max(255),
  body: z.string().min(1, 'Email body is required')
});

const campaignCreateSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required').max(150),
  template_id: z.number().int().positive().optional().nullable(),
  resume_id: z.number().int().positive().optional().nullable(),
  subject_template: z.string().min(1, 'Subject template is required').max(255),
  body_template: z.string().min(1, 'Body template is required'),
  contact_ids: z.array(z.number().int().positive()).min(1, 'At least one recipient must be selected')
});

const testEmailSchema = z.object({
  recipient_email: z.string().email('Valid recipient email is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  resume_id: z.number().int().positive().optional().nullable(),
  contact_sample: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional()
  }).optional()
});

const previewEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  contact: z.object({
    name: z.string().default('Candidate Recipient'),
    title: z.string().default('Hiring Manager'),
    company: z.string().default('Acme Corp')
  })
});

const suppressionSchema = z.object({
  email: z.string().email('Valid email is required'),
  reason: z.string().max(255).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  contactSchema,
  templateSchema,
  campaignCreateSchema,
  testEmailSchema,
  previewEmailSchema,
  suppressionSchema
};
