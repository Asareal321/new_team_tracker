-- The study tab: an allowlisted practice tool for BUS 2257.
--
-- Who can see it is decided here, not in the app: the owner's email is
-- built in, and the owner adds anyone else by email from the tab itself.
-- The questions live in this database behind the same check, so they are
-- not in the public JavaScript bundle. Run once in the Supabase SQL editor;
-- safe to run again (it replaces the question bank, keeps access and history).

create table if not exists study_access (
  email      text primary key check (email = lower(email)),
  added_at   timestamptz not null default now()
);

create table if not exists study_questions (
  id          text primary key,
  position    int not null default 0,
  case_name   text not null,
  topic       text not null,
  stem        text not null,
  choices     jsonb not null,
  answer      int not null,
  explanation text not null
);

create table if not exists study_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  question_id text not null references study_questions(id) on delete cascade,
  correct     boolean not null,
  answered_at timestamptz not null default now()
);
create index if not exists study_attempts_user on study_attempts(user_id, answered_at desc);

create or replace function study_is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'asanichols07@gmail.com'
$$;

create or replace function study_can_view()
returns boolean language sql stable security definer set search_path = public as $$
  select study_is_owner()
      or exists (select 1 from study_access a where a.email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

grant execute on function study_is_owner() to authenticated;
grant execute on function study_can_view() to authenticated;

alter table study_access    enable row level security;
alter table study_questions enable row level security;
alter table study_attempts  enable row level security;

drop policy if exists study_access_owner on study_access;
create policy study_access_owner on study_access
  for all using (study_is_owner()) with check (study_is_owner());

drop policy if exists study_questions_read on study_questions;
create policy study_questions_read on study_questions
  for select using (study_can_view());

drop policy if exists study_attempts_own on study_attempts;
create policy study_attempts_own on study_attempts
  for all using (user_id = auth.uid() and study_can_view())
  with check (user_id = auth.uid() and study_can_view());

-- The bank. Replaced wholesale; answer is the index into choices.
delete from study_questions where id not in (
  $q$t-rent$q$,
  $q$t-giftcards$q$,
  $q$t-invoices$q$,
  $q$t-unrecorded-sale$q$,
  $q$t-inventory$q$,
  $q$t-depreciation$q$,
  $q$t-tax$q$,
  $q$t-closing-loss$q$,
  $q$t-closing-which$q$,
  $q$f-afda-plug$q$,
  $q$f-recovery$q$,
  $q$f-note-maturity$q$,
  $q$f-discount$q$,
  $q$f-cash-sale-return$q$,
  $q$f-writeoff-effect$q$,
  $q$l-fob-terms$q$,
  $q$l-net-cost$q$,
  $q$l-periodic-return$q$,
  $q$l-cogs-plug$q$,
  $q$l-net-sales$q$,
  $q$l-duty$q$,
  $q$k-order-cost$q$,
  $q$k-return-order$q$,
  $q$k-in-transit$q$,
  $q$k-fifo$q$,
  $q$k-avg$q$,
  $q$k-lcnrv$q$,
  $q$p-adjusted-cash$q$,
  $q$p-bank-side$q$,
  $q$p-nsf-entry$q$,
  $q$p-cheque-error$q$,
  $q$b-units-tradein$q$,
  $q$b-ddb-impair$q$,
  $q$b-ddb-floor$q$,
  $q$b-building$q$,
  $q$b-repairs$q$
);

insert into study_questions (id, position, case_name, topic, stem, choices, answer, explanation) values
  ($q$t-rent$q$, 0, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Highland Hoodies Inc. incorporated on September 1 and rented a studio for $1,200 per month. The landlord required the first and last month's rent on signing. Over the fiscal year ended August 31, total rent disbursements were $16,800. The payment made on August 25 covered the coming September's rent.

After adjusting entries, what are Rent Expense for the year and Prepaid Rent at August 31?$q$, $q$["Rent Expense $15,600; Prepaid Rent $1,200", "Rent Expense $14,400; Prepaid Rent $1,200", "Rent Expense $14,400; Prepaid Rent $2,400", "Rent Expense $16,800; Prepaid Rent $0", "Rent Expense $13,200; Prepaid Rent $3,600"]$q$::jsonb, 2, $q$$16,800 ÷ $1,200 = 14 months paid. Only 12 months (September–August) were used, so Rent Expense is $14,400. Two months are still prepaid: the last month of the lease, paid at signing, and next September, paid on August 25. Prepaid Rent is $2,400. The $1,200 answer forgets one of the two.$q$),
  ($q$t-giftcards$q$, 1, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Online cash receipts for the year were $21,300. These included all gift card sales. At year end, $640 of gift cards had not been redeemed. They don't expire, and management expects all of them to be used next year. All receipts were first recorded as Revenue.

What is the year-end adjustment, and how does the $640 appear on the statement of financial position?$q$, $q$["DR Revenue $640, CR Unearned Revenue $640 — a current liability", "No adjustment; the cash was received, so the revenue is earned", "DR Cash $640, CR Unearned Revenue $640 — a current liability", "DR Revenue $640, CR Unearned Revenue $640 — a long-term liability, because the cards never expire", "DR Unearned Revenue $640, CR Revenue $640 — shown in equity"]$q$::jsonb, 0, $q$Revenue is recognized when the goods are delivered, not when cash comes in. The $640 was recorded as revenue but hasn't been earned, so move it out: DR Revenue, CR Unearned Revenue. It's current because management expects redemption within the next year. The cards not expiring doesn't make it long-term.$q$),
  ($q$t-invoices$q$, 2, $q$Tartan Loungewear$q$, $q$Revenue recognition$q$, $q$While reviewing invoices at year end, you find two invoices to retailers totalling $3,425. Work hasn't started on either order, and no payment has been received. Neither invoice has been recorded.

What entry, if any, should be made at year end?$q$, $q$["DR Accounts Receivable $3,425, CR Revenue $3,425", "DR Accounts Receivable $3,425, CR Unearned Revenue $3,425", "DR Cash $3,425, CR Unearned Revenue $3,425", "No entry — nothing has been delivered and no cash has changed hands", "DR Unearned Revenue $3,425, CR Revenue $3,425"]$q$::jsonb, 3, $q$Sending an invoice is not a transaction. Tartan hasn't performed, so there's no revenue. It hasn't received cash, so there's no unearned revenue. And it doesn't yet have a right to collect, so there's no receivable. Recording A/R against Unearned Revenue would inflate both assets and liabilities for work that may never be done.$q$),
  ($q$t-unrecorded-sale$q$, 3, $q$Tartan Loungewear$q$, $q$Revenue recognition$q$, $q$An unpaid $2,200 invoice is found for loungewear delivered to a long-standing retailer on May 25. The fiscal year ends May 31. The retailer has always paid in full, and the sale was never recorded.

Which adjusting entry is required?$q$, $q$["DR Accounts Receivable $2,200, CR Revenue $2,200", "DR Accounts Receivable $2,200, CR Unearned Revenue $2,200", "No entry until the cash is received", "DR Bad Debt Expense $2,200, CR Allowance for Doubtful Accounts $2,200", "DR Cash $2,200, CR Revenue $2,200"]$q$::jsonb, 0, $q$The goods were delivered before year end, so the revenue is earned, and collection is reasonably certain. Record the receivable and the revenue. The customer's payment history is the case's way of telling you not to set up an allowance for it.$q$),
  ($q$t-inventory$q$, 4, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Opening inventory was $0. During the year, Plaid & Co. paid $26,000 cash for clothing inventory, including its first purchase at incorporation. Two orders were unpaid at year end:
• $3,240 from the regular supplier, received in April
• $900 from a new supplier, ordered May 29 and shipped June 3, FOB shipping point

The year ends May 31. The count found $4,600 of inventory on hand.

What is Cost of Goods Sold for the year?$q$, $q$["$21,400", "$24,640", "$25,540", "$29,240", "$30,140"]$q$::jsonb, 1, $q$Inventory available = $26,000 + $3,240 = $29,240. The $900 order shipped after year end FOB shipping point, so Plaid & Co. didn't own it yet: no purchase and no payable. COGS is the plug: $29,240 − $4,600 = $24,640. The $25,540 answer wrongly includes the $900.$q$),
  ($q$t-depreciation$q$, 5, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Point-of-sale equipment was bought on December 1 for $1,440. It has a four-year useful life and no residual value, and is depreciated straight-line. The fiscal year ends May 31.

What depreciation expense is recorded for the first fiscal year?$q$, $q$["$120", "$150", "$180", "$240", "$360"]$q$::jsonb, 2, $q$$1,440 ÷ 4 = $360 per year. It was owned for six months (December through May): $360 × 6/12 = $180. $150 counts only five months; $360 ignores the partial year.$q$),
  ($q$t-tax$q$, 6, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Before tax, a company reports:
• Revenue $62,000
• Cost of Goods Sold $27,400
• Rent Expense $10,200
• Other Expenses $4,100
• Depreciation $300
• Dividends declared $3,000

The tax rate is 14% of net income before tax. What is net income?$q$, $q$["$17,200", "$14,620", "$20,000", "$19,580", "$15,910"]$q$::jsonb, 0, $q$Net income before tax = 62,000 − 27,400 − 10,200 − 4,100 − 300 = $20,000. Tax = 14% × 20,000 = $2,800, so net income = $17,200. Dividends are a distribution of earnings, not an expense, so they never appear on the statement of earnings. $14,620 wrongly deducts them.$q$),
  ($q$t-closing-loss$q$, 7, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, a company has:
• Revenue $40,000
• Total expenses $43,500
• Dividends $1,000
• Opening Retained Earnings $10,000

All four closing entries are made. Which pair is correct?$q$, $q$["Step 3: DR Income Summary $3,500, CR Retained Earnings $3,500 — ending Retained Earnings $12,500", "Step 3: DR Retained Earnings $3,500, CR Income Summary $3,500 — ending Retained Earnings $6,500", "Step 3: DR Retained Earnings $3,500, CR Income Summary $3,500 — ending Retained Earnings $5,500", "Step 3: DR Retained Earnings $4,500, CR Income Summary $4,500 — ending Retained Earnings $5,500", "Step 3: DR Income Summary $3,500, CR Retained Earnings $3,500 — ending Retained Earnings $5,500"]$q$::jsonb, 2, $q$After steps 1 and 2, Income Summary has a $3,500 debit balance: a net loss. Step 3 reverses it: DR Retained Earnings, CR Income Summary $3,500. Step 4 closes dividends: DR Retained Earnings, CR Dividends $1,000. Ending Retained Earnings = 10,000 − 3,500 − 1,000 = $5,500. Step 3 never includes dividends, so the $4,500 option combines two entries.$q$),
  ($q$t-closing-which$q$, 8, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$After all four closing entries, which of these accounts can still have a non-zero balance?$q$, $q$["Income Summary", "Sales Returns and Allowances", "Dividends", "Unearned Revenue", "Cost of Goods Sold"]$q$::jsonb, 3, $q$Closing sets every temporary account to zero: revenues (including contra-revenues such as Sales Returns and Allowances), expenses (including COGS), Income Summary and Dividends. Unearned Revenue is a liability, a permanent account, so it carries forward.$q$),
  ($q$f-afda-plug$q$, 9, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Opening Allowance for Doubtful Accounts (AFDA): $3,100 credit. During the six months:
• Two accounts were written off: $450 and $1,780.
• A customer whose $1,200 account was written off last period paid 40% as final settlement.

The year-end aging schedule:
• Not yet due $22,000 at 2%
• 1–30 days $9,400 at 5%
• 31–60 days $3,200 at 15%
• 61–90 days $1,100 at 30%
• Over 90 days $600 at 50%

What is Bad Debt Expense for the period?$q$, $q$["$2,020", "$1,150", "$670", "$190", "$1,630"]$q$::jsonb, 2, $q$Required ending AFDA = 440 + 470 + 480 + 330 + 300 = $2,020. AFDA before adjusting: 3,100 − 450 − 1,780 + 480 recovered (40% × 1,200) = $1,350 credit. The plug is 2,020 − 1,350 = $670. $1,150 forgets the recovery; $2,020 confuses the ending balance with the expense.$q$),
  ($q$f-recovery$q$, 10, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$On June 12, a customer whose $900 account was written off in a prior period sends a cheque for 40% of it as final settlement.

Which entries record this?$q$, $q$["DR Cash $360, CR Bad Debt Expense $360", "DR Accounts Receivable $360, CR AFDA $360; then DR Cash $360, CR Accounts Receivable $360", "DR Accounts Receivable $900, CR AFDA $900; then DR Cash $360, DR Bad Debt Expense $540, CR Accounts Receivable $900", "DR Cash $360, CR Revenue $360", "DR Accounts Receivable $900, CR AFDA $900; then DR Cash $360, CR Accounts Receivable $360"]$q$::jsonb, 1, $q$Reinstate only what's being paid: DR A/R, CR AFDA for $360. Then record the collection separately: DR Cash, CR A/R. Reinstating the full $900 leaves $540 in A/R that will never be collected. The recovery restores the allowance; it doesn't touch Bad Debt Expense directly.$q$),
  ($q$f-note-maturity$q$, 11, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$On August 1, a customer's $1,500 overdue account is converted to a four-month note at 8% per year. Interest was accrued at the September 30 year end. On December 1 the customer pays in full.

What is the December 1 entry?$q$, $q$["DR Cash $1,540, CR Notes Receivable $1,500, CR Interest Revenue $40", "DR Cash $1,540, CR Notes Receivable $1,500, CR Interest Receivable $20, CR Interest Revenue $20", "DR Cash $1,620, CR Notes Receivable $1,500, CR Interest Revenue $120", "DR Cash $1,540, CR Accounts Receivable $1,500, CR Interest Receivable $40", "DR Cash $1,520, CR Notes Receivable $1,500, CR Interest Receivable $20"]$q$::jsonb, 1, $q$Total interest = 1,500 × 8% × 4/12 = $40. Two months (August and September) were accrued at year end as Interest Receivable of $20. On collection, clear the note and the receivable, and recognize the remaining two months (October and November) as revenue. The $40 interest revenue option double-counts the $20 already recognized last year.$q$),
  ($q$f-discount$q$, 12, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Terms are 3/15, n/45. On September 1, a customer buys $2,000 on credit. On September 4, they're given a $200 allowance for a printing defect and keep the goods. They pay on September 12. Discounts are calculated on the invoice price net of returns and allowances.

What is the entry on September 12?$q$, $q$["DR Cash $1,940, DR Sales Discounts $60, CR Accounts Receivable $2,000", "DR Cash $1,746, DR Sales Discounts $54, CR Accounts Receivable $1,800", "DR Cash $1,740, DR Sales Discounts $60, CR Accounts Receivable $1,800", "DR Cash $1,800, CR Accounts Receivable $1,800", "DR Cash $1,746, DR Sales Returns and Allowances $54, CR Accounts Receivable $1,800"]$q$::jsonb, 1, $q$The balance owing after the allowance is $1,800. Payment is within 15 days, so the discount is 3% × 1,800 = $54 and the cash is $1,746. Discounts have their own contra-revenue account, separate from Sales Returns and Allowances.$q$),
  ($q$f-cash-sale-return$q$, 13, $q$Foote's Print & Design$q$, $q$Revenue recognition$q$, $q$On September 20, a customer paid $340 by cheque for stationery, recorded as a cash sale. On September 25 they returned it for misspellings. It will be reprinted and delivered on October 6. The period ends September 30, and the customer will not be refunded.

What adjustment is needed at September 30?$q$, $q$["No entry; the cash was received and will be kept", "DR Sales Returns and Allowances $340, CR Cash $340", "DR Sales Returns and Allowances $340, CR Unearned Revenue $340", "DR Sales Returns and Allowances $340, CR Accounts Receivable $340", "DR Unearned Revenue $340, CR Revenue $340"]$q$::jsonb, 2, $q$The goods are back with the seller, so the revenue isn't earned at September 30. But the cash was kept, so Foote owes the customer a delivery: a liability. Reverse the revenue through Sales Returns and Allowances and set up Unearned Revenue. It becomes revenue when delivered on October 6. Crediting A/R is wrong because this customer never had a receivable.$q$),
  ($q$f-writeoff-effect$q$, 14, $q$Foote's Print & Design$q$, $q$Allowance method$q$, $q$Under the allowance method, a $2,036 account is written off. Which statement is true?$q$, $q$["Net accounts receivable falls by $2,036 and Bad Debt Expense rises by $2,036", "Net accounts receivable is unchanged and there is no effect on net income", "Net accounts receivable is unchanged but Bad Debt Expense rises by $2,036", "Gross accounts receivable is unchanged and AFDA falls by $2,036", "Net accounts receivable falls by $2,036 and there is no effect on net income"]$q$::jsonb, 1, $q$DR AFDA, CR A/R reduces both sides of net A/R by the same amount, so net A/R is unchanged. The expense was already recognized when the allowance was estimated. That's the point of the allowance method.$q$),
  ($q$l-fob-terms$q$, 15, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$On May 4, a company orders tea from Colombo, Sri Lanka, with terms 10 EOM, FOB Mississauga. Mississauga is the buyer's city. The goods leave Colombo on May 8 and arrive on May 25. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded May 4; due June 10", "Recorded May 8; due June 10", "Recorded May 25; due June 10", "Recorded May 25; due June 4", "Recorded May 8; due May 18"]$q$::jsonb, 2, $q$FOB Mississauga is FOB destination, so ownership passes when the goods arrive on May 25. That's when the purchase and the payable are recorded. "10 EOM" means payment is due 10 days after the end of the month of ownership: June 10.$q$),
  ($q$l-net-cost$q$, 16, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$On June 3, a company orders herbs at an invoice price of $2,400, shipped that day FOB shipping point. Freight of $120 is paid in cash to the carrier on arrival, June 6. Terms are 4/10, n/30 from the date of ownership. On June 8, $200 of damaged herbs are returned for credit. The account is paid on June 12. Discounts are calculated on the invoice price net of returns.

What is the net cost added to Inventory for this order?$q$, $q$["$2,112", "$2,232", "$2,320", "$2,227", "$2,240"]$q$::jsonb, 1, $q$Ownership passed June 3 (FOB shipping point), so the discount window runs to June 13 and the June 12 payment qualifies. Discount = 4% × (2,400 − 200) = $88. Freight-in is part of inventory cost. Net cost = 2,400 + 120 − 200 − 88 = $2,232. $2,112 is the cash paid to the supplier, which leaves out freight; $2,227 wrongly applies the discount to freight too.$q$),
  ($q$l-periodic-return$q$, 17, $q$Lakeshore Tea$q$, $q$Periodic system$q$, $q$A periodic inventory system is used. A customer returns $168 of goods bought on credit, and the goods go back on the shelf.

What does the seller record?$q$, $q$["DR Sales Returns and Allowances $168, CR Accounts Receivable $168", "DR Sales Returns and Allowances $168, CR Accounts Receivable $168; DR Inventory, CR Cost of Goods Sold at cost", "DR Revenue $168, CR Inventory $168", "DR Inventory $168, CR Accounts Receivable $168", "No entry until the month-end count"]$q$::jsonb, 0, $q$In a periodic system, Inventory and COGS aren't touched during the period. The returned goods are picked up by the physical count, and COGS comes out as the plug. Only the revenue side is recorded: DR Sales Returns and Allowances, CR A/R. The second option is the perpetual-system entry.$q$),
  ($q$l-cogs-plug$q$, 18, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$For May:
• Opening inventory $5,900
• Purchases $7,400 (including freight-in)
• Purchase returns $150
• Purchase discounts $200
• Physical count at May 31: $6,100

One sale's notes say "cost of goods sold to the co-op was $437." Inventory is periodic. What is COGS for May?$q$, $q$["$6,850", "$7,200", "$437", "$7,287", "$6,413"]$q$::jsonb, 0, $q$Goods available = 5,900 + 7,400 − 150 − 200 = $12,950. COGS = 12,950 − 6,100 = $6,850. In a periodic system, per-sale cost notes aren't recorded; they're there to tempt you.$q$),
  ($q$l-net-sales$q$, 19, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$For the month:
• Credit sales $9,000
• Cash sales $1,500
• Sales allowances given $300
• Goods returned by customers $200
• Sales discounts taken $150
• The month's freight-out was $90

What is net sales?$q$, $q$["$10,500", "$10,000", "$9,850", "$9,760", "$10,350"]$q$::jsonb, 2, $q$Net sales = gross sales of 10,500 − returns and allowances of 500 − discounts of 150 = $9,850. Freight-out is a selling expense, not a reduction of revenue, so $9,760 is wrong.$q$),
  ($q$l-duty$q$, 20, $q$Lakeshore Tea$q$, $q$Duty and freight$q$, $q$A Canadian company imports goods FOB the supplier's warehouse in Seattle. Who bears the import duty, and how is it treated?$q$, $q$["The seller, because the goods are shipped from its warehouse", "The buyer, expensed as Duty Expense", "The buyer, added to the cost of Inventory", "Split between buyer and seller according to the FOB point", "The carrier, recovered through the freight charge"]$q$::jsonb, 2, $q$Import duty is always paid by the buyer, whatever the FOB point. It's a cost of getting the goods into saleable condition, so it's added to Inventory, like freight-in.$q$),
  ($q$k-order-cost$q$, 21, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$3,000 bottles are bought from Seattle at a gross price of $3.40 each. Terms are 3/10, n/15, shipped FOB Seattle. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. The account is paid within 10 days of shipping. Discounts are calculated on the invoice price.

What is the total cost of the order, and the cost per bottle (to three decimals)?$q$, $q$["$11,663; $3.888", "$11,357; $3.786", "$11,337; $3.779", "$10,557; $3.519", "$11,051; $3.684"]$q$::jsonb, 1, $q$Invoice 10,200 + duty 663 (6.5%) + freight 800 (FOB shipping point, so the buyer pays) − discount 306 (3% of 10,200) = $11,357. Per bottle: 11,357 ÷ 3,000 = $3.786. $11,337 takes the discount on duty as well; $10,557 leaves out freight.$q$),
  ($q$k-return-order$q$, 22, $q$Kombucha Canada$q$, $q$Purchase returns$q$, $q$2,500 bottles at $3.10 are bought from Seattle, shipped FOB Seattle with flat freight of $800. Terms are 3/10, n/15, and the discount is taken. Duty is 6.5% of the invoice price. 200 bottles are returned for quality problems. The supplier pays the return shipping and refunds all duty on the returned bottles. Discounts are calculated on the invoice price net of returns.

What are the total net cost and the cost per bottle kept?$q$, $q$["$8,220; $3.574", "$8,161; $3.548", "$8,180; $3.556", "$8,893; $3.557", "$7,380; $3.209"]$q$::jsonb, 2, $q$Net invoice = 7,750 − 620 = $7,130. Duty on the bottles kept = 6.5% × 7,130 = $463.45. Freight stays at $800 because the supplier paid the return leg. Discount = 3% × 7,130 = $213.90. Total = 7,130 + 463.45 + 800 − 213.90 = $8,179.55, so $8,180. Per bottle: 8,180 ÷ 2,300 = $3.556. $8,220 forgets the duty refund; $8,161 takes the discount on the gross invoice.$q$),
  ($q$k-in-transit$q$, 23, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The April 30 count finds 5,000 bottles. Two orders are not in the building:
• 3,000 bottles shipped April 27 FOB shipping point, arriving May 3
• 2,000 bottles shipped April 25 FOB destination, arriving May 2

How many bottles belong in ending inventory?$q$, $q$["5,000", "7,000", "8,000", "10,000", "6,000"]$q$::jsonb, 2, $q$FOB shipping point: the buyer owns the goods from shipment, so the 3,000 in transit are included even though nobody counted them. FOB destination: the 2,000 still belong to the seller. 5,000 + 3,000 = 8,000.$q$),
  ($q$k-fifo$q$, 24, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,000 bottles costing $6,800
• Western: 8,000 bottles costing $27,600 ($3.45 each)
• Tapped: 2,300 bottles costing $8,180
• Fry: 4,000 bottles costing $14,800 ($3.70 each)

Ending inventory is 6,500 bottles. Under FIFO, what is COGS?$q$, $q$["$33,710", "$23,670", "$34,498", "$35,750", "$22,882"]$q$::jsonb, 0, $q$Goods available = $57,380 for 16,300 bottles. Under FIFO the oldest bottles are sold first, so the 6,500 left are the newest: 4,000 × 3.70 (14,800) + 2,300 Tapped (8,180) + 200 × 3.45 (690) = $23,670. COGS = 57,380 − 23,670 = $33,710. $23,670 is ending inventory, not COGS; $34,498 is the weighted-average answer.$q$),
  ($q$k-avg$q$, 25, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Same data as before: goods available of $57,380 for 16,300 bottles, and 6,500 bottles on hand at year end.

Under the weighted-average method, what is COGS, to the nearest dollar?$q$, $q$["$33,710", "$34,498", "$22,882", "$35,180", "$34,650"]$q$::jsonb, 1, $q$Average cost = 57,380 ÷ 16,300 = $3.5202. Units sold = 16,300 − 6,500 = 9,800. COGS = 9,800 × 3.5202 = $34,498. Ending inventory = 57,380 − 34,498 = $22,882.$q$),
  ($q$k-lcnrv$q$, 26, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Using the FIFO layers in ending inventory:
• 4,000 bottles at $3.70
• 2,300 bottles at $3.556
• 200 bottles at $3.45

Net realizable value is $3.50 per bottle. FIFO cost of ending inventory is $23,670. After applying lower of cost and NRV item by item, what is ending inventory, and what happens to the write-down?$q$, $q$["$22,750; the $920 write-down is credited to Inventory and charged to COGS", "$22,740; the $930 write-down is credited to Inventory and charged to COGS", "$22,740; the $930 write-down is recorded as a gain", "$22,750; recorded as an impairment loss on long-lived assets", "$23,670; NRV only applies if every layer is below cost"]$q$::jsonb, 1, $q$Only layers costing more than NRV are written down: 4,000 × 3.50 = 14,000 and 2,300 × 3.50 = 8,050. The 200 at $3.45 stay at cost ($690). Ending inventory = $22,740, a write-down of $930. Using the plug method, the lower ending balance flows into COGS: DR COGS, CR Inventory. $22,750 writes the $3.45 layer up to NRV, which is never allowed.$q$),
  ($q$p-adjusted-cash$q$, 27, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The company's books show $11,300 at March 31. The bank statement shows:
• An automatic insurance withdrawal of $400, not yet recorded by the company
• An automatic payroll deduction of $1,050, not yet recorded
• Service charges of $132, which include a $20 NSF fee
• A customer's $2,200 cheque returned NSF

You also find that cheque #40 cleared at $966.66 but was recorded in the books as $669.66.

What is the adjusted cash balance per company records?$q$, $q$["$7,815", "$7,221", "$7,201", "$8,271", "$7,241"]$q$::jsonb, 1, $q$11,300 − 400 − 1,050 − 132 − 2,200 − 297 (the cheque was recorded $297 too low, so cash is overstated) = $7,221. The $20 NSF fee is already inside the $132, so taking it off again gives $7,201. Adding the $297 back gives $7,815.$q$),
  ($q$p-bank-side$q$, 28, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement shows $8,021 at March 31. A $1,000 deposit made on the evening of March 31 isn't on the statement. Cheque #41 for $1,800 hasn't cleared. Cheque #12, outstanding at the February reconciliation, has also not cleared, and is for $42.

What is the adjusted balance per bank?$q$, $q$["$7,221", "$7,179", "$7,263", "$6,221", "$9,179"]$q$::jsonb, 1, $q$8,021 + 1,000 deposit in transit − 1,800 − 42 = $7,179. A cheque still outstanding from last month stays on the list until it clears. Dropping #12 gives $7,221. Bank-side items are things the company has recorded and the bank hasn't yet.$q$),
  ($q$p-nsf-entry$q$, 29, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$The bank returned a customer's $2,200 cheque marked NSF and charged a $20 NSF fee, included in a $132 service charge. Company policy is to charge NSF fees back to the customer.

Which entries correct the company's cash?$q$, $q$["DR Accounts Receivable $2,200, CR Cash $2,200; DR Bank Charges Expense $132, CR Cash $132", "DR Accounts Receivable $2,220, CR Cash $2,220; DR Bank Charges Expense $132, CR Cash $132", "DR Accounts Receivable $2,200, CR Cash $2,200; DR Bank Charges Expense $112, DR Accounts Receivable $20, CR Cash $132", "DR Bad Debt Expense $2,200, CR Cash $2,200; DR Bank Charges Expense $132, CR Cash $132", "DR Revenue $2,200, CR Cash $2,200; DR Bank Charges Expense $112, DR Accounts Receivable $20, CR Cash $132"]$q$::jsonb, 2, $q$The bounced cheque puts the customer back in A/R. The $20 fee is part of the $132, so only $112 is expense and $20 is charged to the customer. The second option takes the $20 twice: once in the $2,220 and again inside the $132. Nothing is written off yet, so Bad Debt Expense is wrong.$q$),
  ($q$p-cheque-error$q$, 30, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$Cheque #40 to a delivery company for customer deliveries was written and cleared at $966.66. It was entered in the cash disbursements journal as $669.66.

What is the correcting entry?$q$, $q$["DR Delivery Expense $297, CR Cash $297", "DR Cash $297, CR Delivery Expense $297", "DR Delivery Expense $966.66, CR Cash $966.66", "No entry; it's a bank-side reconciling item", "DR Accounts Payable $297, CR Cash $297"]$q$::jsonb, 0, $q$The bank is right, and the company recorded $297 too little expense and too little cash outflow. Correct the books: DR Delivery Expense, CR Cash $297. It's a company-side item because the company made the error.$q$),
  ($q$b-units-tradein$q$, 31, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A pitching machine cost $5,500, has a residual value of $500, and a life of 1,000,000 balls. By the start of the year it had pitched 220,000 balls. This year it pitched 80,000 more before being traded in on August 31. The new machine's price is $7,000, the trade-in allowance is $3,200, and the rest is paid in cash.

Which is correct?$q$, $q$["Book value at trade-in $4,000; gain $800; new machine recorded at $3,800", "Book value at trade-in $4,400; loss $1,200; new machine recorded at $7,000", "Book value at trade-in $4,000; loss $800; cash paid $3,800; new machine recorded at $7,000", "Book value at trade-in $4,000; loss $800; cash paid $3,800; new machine recorded at $3,800", "Book value at trade-in $3,500; loss $300; cash paid $3,800; new machine recorded at $7,000"]$q$::jsonb, 2, $q$Rate = (5,500 − 500) ÷ 1,000,000 = $0.005 per ball. Accumulated depreciation = 300,000 × 0.005 = $1,500, so book value = $4,000. You must depreciate up to the trade-in date first. The trade-in allowance of $3,200 is $800 below book value: a loss of $800. Cash paid = 7,000 − 3,200 = $3,800. The new machine goes on the books at its price of $7,000. The entry: DR New Machine 7,000, DR Accumulated Depreciation 1,500, DR Loss 800; CR Cash 3,800, CR Old Machine 5,500.$q$),
  ($q$b-ddb-impair$q$, 32, $q$Barry's Batting Cages$q$, $q$Declining balance and impairment$q$, $q$A kiosk cost $24,000, has a residual value of $2,000, and is depreciated double-declining-balance over six years. At the end of year 3 its recoverable amount is $6,000.

What is year-3 depreciation, and what is the impairment loss?$q$, $q$["Depreciation $3,556; impairment $1,111", "Depreciation $3,667; impairment $1,000", "Depreciation $2,370; impairment $3,556", "Depreciation $3,556; impairment $5,111", "Depreciation $4,000; impairment $0"]$q$::jsonb, 0, $q$The rate is 2 ÷ 6, applied to book value, with residual value ignored until the floor. Year 1: 8,000 (book value 16,000). Year 2: 5,333 (book value 10,667). Year 3: 3,556 (book value 7,111). Recoverable $6,000 is below book value, so impairment = 7,111 − 6,000 = $1,111: DR Impairment Loss, CR Accumulated Depreciation. $3,667 wrongly takes residual value off before applying the rate.$q$),
  ($q$b-ddb-floor$q$, 33, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $10,000, has a residual value of $2,500, and is depreciated double-declining-balance over five years.

What is depreciation in year 3?$q$, $q$["$1,440", "$1,100", "$1,500", "$864", "$0"]$q$::jsonb, 1, $q$The rate is 40%. Year 1: 4,000 (book value 6,000). Year 2: 2,400 (book value 3,600). Year 3 at 40% would be 1,440, taking book value to 2,160, below the $2,500 residual. Depreciation stops at the residual: 3,600 − 2,500 = $1,100. Years 4 and 5 get nothing.$q$),
  ($q$b-building$q$, 34, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land and a building were bought together on November 1, 2009: land $230,000, building $400,000. The building has a 30-year life and a $40,000 residual value, depreciated straight-line. The year ends October 31.

What is the carrying amount of land plus building at October 31, 2012?$q$, $q$["$594,000", "$588,000", "$582,000", "$594,333", "$617,000"]$q$::jsonb, 0, $q$Building depreciation = (400,000 − 40,000) ÷ 30 = $12,000 a year. Three years to October 31, 2012 = $36,000, so the building's carrying amount is $364,000. Land isn't depreciated. Total = 230,000 + 364,000 = $594,000. $582,000 wrongly depreciates the land over 30 years.$q$),
  ($q$b-repairs$q$, 35, $q$Barry's Batting Cages$q$, $q$Capital vs. revenue expenditure$q$, $q$$400 cash is spent patching the mesh on three batting cages. The repair restores them to working order but doesn't extend their useful life or capacity.

How is it recorded?$q$, $q$["DR Batting Cages $400, CR Cash $400", "DR Repairs Expense $400, CR Cash $400", "DR Accumulated Depreciation $400, CR Cash $400", "DR Batting Cages $400, CR Cash $400, and recalculate depreciation", "Spread over the cages' remaining life as a prepaid"]$q$::jsonb, 1, $q$Ordinary repairs that only keep an asset working are expensed as incurred. Capitalizing is for spending that extends the asset's life or improves it. Debiting Accumulated Depreciation is reserved for major overhauls that extend useful life.$q$)
on conflict (id) do update set
  position = excluded.position, case_name = excluded.case_name, topic = excluded.topic,
  stem = excluded.stem, choices = excluded.choices, answer = excluded.answer,
  explanation = excluded.explanation;
