-- Threading metadata needed to send replies through the Gmail API (georginasfoods@gmail.com)
-- instead of Resend, so replies land in the same Gmail thread the customer already has open.
alter table messages add column if not exists gmail_message_id text;
alter table messages add column if not exists gmail_thread_id text;
alter table messages add column if not exists rfc_message_id text;
