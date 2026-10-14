-- The large practice bank for the Study tab: 340 questions generated
-- from templates over the six term-one cases, each with fresh numbers.
-- Every answer is computed, and every wrong choice is a specific mistake
-- (forgetting a recovery, taking a discount on freight, depreciating land...).
--
-- Run after migration-study.sql. Safe to run again: it replaces the
-- generated questions (ids starting g-) and leaves the hand-written ones.

delete from study_questions where id like 'g-%';

insert into study_questions (id, position, case_name, topic, stem, choices, answer, explanation) values
  ($q$g-rent-01$q$, 1000, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Huron Hill Sports Ltd. started business on the first day of its fiscal year and rented space at $750 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $9,750.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $9,000; Prepaid Rent $750", "Rent Expense $9,750; Prepaid Rent $0", "Rent Expense $8,250; Prepaid Rent $1,500", "Rent Expense $9,000; Prepaid Rent $1,500", "Rent Expense $8,370; Prepaid Rent $698"]$q$::jsonb, 0, $q$$9,750 ÷ $750 = 13 months paid. Twelve were used this year, so the expense is $9,000. The rest — the last month of the lease — is still prepaid: $750.$q$),
  ($q$g-rent-02$q$, 1001, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Coves Beverages started business on the first day of its fiscal year and rented space at $1,400 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $21,000. Payments made near year end also covered the first 2 months of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $16,800; Prepaid Rent $4,200", "Rent Expense $21,000; Prepaid Rent $0", "Rent Expense $16,800; Prepaid Rent $1,400", "Rent Expense $15,400; Prepaid Rent $5,600", "Rent Expense $19,600; Prepaid Rent $1,400"]$q$::jsonb, 0, $q$$21,000 ÷ $1,400 = 15 months paid. Twelve were used this year, so the expense is $16,800. The rest — the last month of the lease, plus 2 months of next year — is still prepaid: $4,200.$q$),
  ($q$g-rent-03$q$, 1002, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Kingsway Apparel started business on the first day of its fiscal year and rented space at $1,400 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $18,200.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $16,800; Prepaid Rent $1,400", "Rent Expense $18,200; Prepaid Rent $0", "Rent Expense $15,400; Prepaid Rent $2,800", "Rent Expense $16,800; Prepaid Rent $2,800", "Rent Expense $15,624; Prepaid Rent $1,302"]$q$::jsonb, 0, $q$$18,200 ÷ $1,400 = 13 months paid. Twelve were used this year, so the expense is $16,800. The rest — the last month of the lease — is still prepaid: $1,400.$q$),
  ($q$g-rent-04$q$, 1003, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Stoney Creek Goods Inc. started business on the first day of its fiscal year and rented space at $1,250 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $17,500. Payments made near year end also covered the first 1 month of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $15,000; Prepaid Rent $2,500", "Rent Expense $17,500; Prepaid Rent $0", "Rent Expense $15,000; Prepaid Rent $1,250", "Rent Expense $13,750; Prepaid Rent $3,750", "Rent Expense $16,250; Prepaid Rent $1,250"]$q$::jsonb, 0, $q$$17,500 ÷ $1,250 = 14 months paid. Twelve were used this year, so the expense is $15,000. The rest — the last month of the lease, plus 1 month of next year — is still prepaid: $2,500.$q$),
  ($q$g-rent-05$q$, 1004, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Northshore Imports started business on the first day of its fiscal year and rented space at $750 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $11,250. Payments made near year end also covered the first 2 months of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $9,000; Prepaid Rent $2,250", "Rent Expense $11,250; Prepaid Rent $0", "Rent Expense $9,000; Prepaid Rent $750", "Rent Expense $8,250; Prepaid Rent $3,000", "Rent Expense $10,500; Prepaid Rent $750"]$q$::jsonb, 0, $q$$11,250 ÷ $750 = 15 months paid. Twelve were used this year, so the expense is $9,000. The rest — the last month of the lease, plus 2 months of next year — is still prepaid: $2,250.$q$),
  ($q$g-rent-06$q$, 1005, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Talbot Stationers started business on the first day of its fiscal year and rented space at $1,400 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $19,600. Payments made near year end also covered the first 1 month of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $16,800; Prepaid Rent $2,800", "Rent Expense $19,600; Prepaid Rent $0", "Rent Expense $16,800; Prepaid Rent $1,400", "Rent Expense $15,400; Prepaid Rent $4,200", "Rent Expense $18,200; Prepaid Rent $1,400"]$q$::jsonb, 0, $q$$19,600 ÷ $1,400 = 14 months paid. Twelve were used this year, so the expense is $16,800. The rest — the last month of the lease, plus 1 month of next year — is still prepaid: $2,800.$q$),
  ($q$g-rent-07$q$, 1006, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Hyde Park Goods Inc. started business on the first day of its fiscal year and rented space at $1,100 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $16,500. Payments made near year end also covered the first 2 months of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $13,200; Prepaid Rent $3,300", "Rent Expense $16,500; Prepaid Rent $0", "Rent Expense $13,200; Prepaid Rent $1,100", "Rent Expense $12,100; Prepaid Rent $4,400", "Rent Expense $15,400; Prepaid Rent $1,100"]$q$::jsonb, 0, $q$$16,500 ÷ $1,100 = 15 months paid. Twelve were used this year, so the expense is $13,200. The rest — the last month of the lease, plus 2 months of next year — is still prepaid: $3,300.$q$),
  ($q$g-rent-08$q$, 1007, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Masonville Sports Ltd. started business on the first day of its fiscal year and rented space at $1,600 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $22,400. Payments made near year end also covered the first 1 month of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $19,200; Prepaid Rent $3,200", "Rent Expense $22,400; Prepaid Rent $0", "Rent Expense $19,200; Prepaid Rent $1,600", "Rent Expense $17,600; Prepaid Rent $4,800", "Rent Expense $20,800; Prepaid Rent $1,600"]$q$::jsonb, 0, $q$$22,400 ÷ $1,600 = 14 months paid. Twelve were used this year, so the expense is $19,200. The rest — the last month of the lease, plus 1 month of next year — is still prepaid: $3,200.$q$),
  ($q$g-rent-09$q$, 1008, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Oakridge Sports Ltd. started business on the first day of its fiscal year and rented space at $1,100 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $15,400. Payments made near year end also covered the first 1 month of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $13,200; Prepaid Rent $2,200", "Rent Expense $15,400; Prepaid Rent $0", "Rent Expense $13,200; Prepaid Rent $1,100", "Rent Expense $12,100; Prepaid Rent $3,300", "Rent Expense $14,300; Prepaid Rent $1,100"]$q$::jsonb, 0, $q$$15,400 ÷ $1,100 = 14 months paid. Twelve were used this year, so the expense is $13,200. The rest — the last month of the lease, plus 1 month of next year — is still prepaid: $2,200.$q$),
  ($q$g-rent-10$q$, 1009, $q$Tartan Loungewear$q$, $q$Prepaids and adjusting entries$q$, $q$Glenview Imports started business on the first day of its fiscal year and rented space at $1,100 per month. The landlord required the first and last month's rent on signing. Total rent disbursements for the year were $15,400. Payments made near year end also covered the first 1 month of next year.

What are Rent Expense for the year and Prepaid Rent at year end?$q$, $q$["Rent Expense $13,200; Prepaid Rent $2,200", "Rent Expense $15,400; Prepaid Rent $0", "Rent Expense $13,200; Prepaid Rent $1,100", "Rent Expense $12,100; Prepaid Rent $3,300", "Rent Expense $14,300; Prepaid Rent $1,100"]$q$::jsonb, 0, $q$$15,400 ÷ $1,100 = 14 months paid. Twelve were used this year, so the expense is $13,200. The rest — the last month of the lease, plus 1 month of next year — is still prepaid: $2,200.$q$),
  ($q$g-supplies-01$q$, 1010, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Maple Ridge Outfitters began the year with $410 of supplies. During the year it bought $1,800 more, all debited to Supplies. The year-end count shows $655 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $1,555, CR Supplies $1,555", "DR Supplies Expense $1,145, CR Supplies $1,145", "DR Supplies Expense $1,800, CR Supplies $1,800", "DR Supplies Expense $2,210, CR Supplies $2,210", "DR Supplies Expense $655, CR Supplies $655"]$q$::jsonb, 0, $q$Supplies used = opening $410 + purchases $1,800 − on hand $655 = $1,555. Forgetting the opening balance gives $1,145.$q$),
  ($q$g-supplies-02$q$, 1011, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Cedar Lane Stationers began the year with $720 of supplies. During the year it bought $3,190 more, all debited to Supplies. The year-end count shows $625 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $3,285, CR Supplies $3,285", "DR Supplies Expense $2,565, CR Supplies $2,565", "DR Supplies Expense $3,190, CR Supplies $3,190", "DR Supplies Expense $3,910, CR Supplies $3,910", "DR Supplies Expense $625, CR Supplies $625"]$q$::jsonb, 0, $q$Supplies used = opening $720 + purchases $3,190 − on hand $625 = $3,285. Forgetting the opening balance gives $2,565.$q$),
  ($q$g-supplies-03$q$, 1012, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Springbank Tea Co. began the year with $340 of supplies. During the year it bought $2,370 more, all debited to Supplies. The year-end count shows $510 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $2,200, CR Supplies $2,200", "DR Supplies Expense $1,860, CR Supplies $1,860", "DR Supplies Expense $2,370, CR Supplies $2,370", "DR Supplies Expense $2,710, CR Supplies $2,710", "DR Supplies Expense $510, CR Supplies $510"]$q$::jsonb, 0, $q$Supplies used = opening $340 + purchases $2,370 − on hand $510 = $2,200. Forgetting the opening balance gives $1,860.$q$),
  ($q$g-supplies-04$q$, 1013, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Westmount Sports Ltd. began the year with $300 of supplies. During the year it bought $3,180 more, all debited to Supplies. The year-end count shows $455 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $3,025, CR Supplies $3,025", "DR Supplies Expense $2,725, CR Supplies $2,725", "DR Supplies Expense $3,180, CR Supplies $3,180", "DR Supplies Expense $3,480, CR Supplies $3,480", "DR Supplies Expense $455, CR Supplies $455"]$q$::jsonb, 0, $q$Supplies used = opening $300 + purchases $3,180 − on hand $455 = $3,025. Forgetting the opening balance gives $2,725.$q$),
  ($q$g-supplies-05$q$, 1014, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Riverbend Apparel began the year with $310 of supplies. During the year it bought $3,900 more, all debited to Supplies. The year-end count shows $425 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $3,785, CR Supplies $3,785", "DR Supplies Expense $3,475, CR Supplies $3,475", "DR Supplies Expense $3,900, CR Supplies $3,900", "DR Supplies Expense $4,210, CR Supplies $4,210", "DR Supplies Expense $425, CR Supplies $425"]$q$::jsonb, 0, $q$Supplies used = opening $310 + purchases $3,900 − on hand $425 = $3,785. Forgetting the opening balance gives $3,475.$q$),
  ($q$g-supplies-06$q$, 1015, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Lakehead Outfitters began the year with $760 of supplies. During the year it bought $3,590 more, all debited to Supplies. The year-end count shows $205 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $4,145, CR Supplies $4,145", "DR Supplies Expense $3,385, CR Supplies $3,385", "DR Supplies Expense $3,590, CR Supplies $3,590", "DR Supplies Expense $4,350, CR Supplies $4,350", "DR Supplies Expense $205, CR Supplies $205"]$q$::jsonb, 0, $q$Supplies used = opening $760 + purchases $3,590 − on hand $205 = $4,145. Forgetting the opening balance gives $3,385.$q$),
  ($q$g-supplies-07$q$, 1016, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Coves Goods Inc. began the year with $250 of supplies. During the year it bought $2,350 more, all debited to Supplies. The year-end count shows $380 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $2,220, CR Supplies $2,220", "DR Supplies Expense $1,970, CR Supplies $1,970", "DR Supplies Expense $2,350, CR Supplies $2,350", "DR Supplies Expense $2,600, CR Supplies $2,600", "DR Supplies Expense $380, CR Supplies $380"]$q$::jsonb, 0, $q$Supplies used = opening $250 + purchases $2,350 − on hand $380 = $2,220. Forgetting the opening balance gives $1,970.$q$),
  ($q$g-supplies-08$q$, 1017, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Glenview Goods Inc. began the year with $490 of supplies. During the year it bought $2,920 more, all debited to Supplies. The year-end count shows $205 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $3,205, CR Supplies $3,205", "DR Supplies Expense $2,715, CR Supplies $2,715", "DR Supplies Expense $2,920, CR Supplies $2,920", "DR Supplies Expense $3,410, CR Supplies $3,410", "DR Supplies Expense $205, CR Supplies $205"]$q$::jsonb, 0, $q$Supplies used = opening $490 + purchases $2,920 − on hand $205 = $3,205. Forgetting the opening balance gives $2,715.$q$),
  ($q$g-supplies-09$q$, 1018, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Wortley Imports began the year with $530 of supplies. During the year it bought $3,930 more, all debited to Supplies. The year-end count shows $365 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $4,095, CR Supplies $4,095", "DR Supplies Expense $3,565, CR Supplies $3,565", "DR Supplies Expense $3,930, CR Supplies $3,930", "DR Supplies Expense $4,460, CR Supplies $4,460", "DR Supplies Expense $365, CR Supplies $365"]$q$::jsonb, 0, $q$Supplies used = opening $530 + purchases $3,930 − on hand $365 = $4,095. Forgetting the opening balance gives $3,565.$q$),
  ($q$g-supplies-10$q$, 1019, $q$Tartan Loungewear$q$, $q$Adjusting entries$q$, $q$Birchwood Apparel began the year with $600 of supplies. During the year it bought $3,530 more, all debited to Supplies. The year-end count shows $240 on hand.

What is the adjusting entry?$q$, $q$["DR Supplies Expense $3,890, CR Supplies $3,890", "DR Supplies Expense $3,290, CR Supplies $3,290", "DR Supplies Expense $3,530, CR Supplies $3,530", "DR Supplies Expense $4,130, CR Supplies $4,130", "DR Supplies Expense $240, CR Supplies $240"]$q$::jsonb, 0, $q$Supplies used = opening $600 + purchases $3,530 − on hand $240 = $3,890. Forgetting the opening balance gives $3,290.$q$),
  ($q$g-giftcard-01$q$, 1020, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Fanshawe Tea Co.'s online cash receipts of $20,480 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $1,080 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$19,400", "$20,480", "$21,560", "$1,080", "$18,320"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $1,080, CR Unearned Revenue $1,080, a current liability. Revenue = $20,480 − $1,080 = $19,400.$q$),
  ($q$g-giftcard-02$q$, 1021, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Fanshawe Apparel's online cash receipts of $13,330 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $390 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$12,940", "$13,330", "$13,720", "$390", "$12,550"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $390, CR Unearned Revenue $390, a current liability. Revenue = $13,330 − $390 = $12,940.$q$),
  ($q$g-giftcard-03$q$, 1022, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Lakehead Goods Inc.'s online cash receipts of $24,880 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $700 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$24,180", "$24,880", "$25,580", "$700", "$23,480"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $700, CR Unearned Revenue $700, a current liability. Revenue = $24,880 − $700 = $24,180.$q$),
  ($q$g-giftcard-04$q$, 1023, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Hyde Park Supply Ltd.'s online cash receipts of $18,350 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $1,100 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$17,250", "$18,350", "$19,450", "$1,100", "$16,150"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $1,100, CR Unearned Revenue $1,100, a current liability. Revenue = $18,350 − $1,100 = $17,250.$q$),
  ($q$g-giftcard-05$q$, 1024, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Riverbend Supply Ltd.'s online cash receipts of $28,710 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $650 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$28,060", "$28,710", "$29,360", "$650", "$27,410"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $650, CR Unearned Revenue $650, a current liability. Revenue = $28,710 − $650 = $28,060.$q$),
  ($q$g-giftcard-06$q$, 1025, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Elgin Stationers's online cash receipts of $12,910 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $930 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$11,980", "$12,910", "$13,840", "$930", "$11,050"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $930, CR Unearned Revenue $930, a current liability. Revenue = $12,910 − $930 = $11,980.$q$),
  ($q$g-giftcard-07$q$, 1026, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Glenview Sports Ltd.'s online cash receipts of $14,310 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $510 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$13,800", "$14,310", "$14,820", "$510", "$13,290"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $510, CR Unearned Revenue $510, a current liability. Revenue = $14,310 − $510 = $13,800.$q$),
  ($q$g-giftcard-08$q$, 1027, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Thames Valley Imports's online cash receipts of $22,680 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $740 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$21,940", "$22,680", "$23,420", "$740", "$21,200"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $740, CR Unearned Revenue $740, a current liability. Revenue = $22,680 − $740 = $21,940.$q$),
  ($q$g-giftcard-09$q$, 1028, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Byron Imports's online cash receipts of $26,100 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $440 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$25,660", "$26,100", "$26,540", "$440", "$25,220"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $440, CR Unearned Revenue $440, a current liability. Revenue = $26,100 − $440 = $25,660.$q$),
  ($q$g-giftcard-10$q$, 1029, $q$Tartan Loungewear$q$, $q$Unearned revenue$q$, $q$Northshore Beverages's online cash receipts of $19,410 include all gift cards sold this year, and all of it was credited to Revenue. At year end, $930 of this year's gift cards are unredeemed and expected to be used next year.

How much online revenue belongs on this year's statement of earnings?$q$, $q$["$18,480", "$19,410", "$20,340", "$930", "$17,550"]$q$::jsonb, 0, $q$Unredeemed cards are unearned: DR Revenue $930, CR Unearned Revenue $930, a current liability. Revenue = $19,410 − $930 = $18,480.$q$),
  ($q$g-partialdep-01$q$, 1030, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Northshore Stationers has a December 31 year end. On August 1 it bought equipment for $2,160, with a 5-year life and a residual value of $100, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$172", "$412", "$180", "$137", "$206"]$q$::jsonb, 0, $q$($2,160 − $100) ÷ 5 = $412 a year, × 5/12 months owned = $172.$q$),
  ($q$g-partialdep-02$q$, 1031, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Hyde Park Supply Ltd. has a December 31 year end. On February 1 it bought equipment for $5,880, with a 6-year life and a residual value of $300, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$853", "$930", "$898", "$775", "$980"]$q$::jsonb, 0, $q$($5,880 − $300) ÷ 6 = $930 a year, × 11/12 months owned = $853.$q$),
  ($q$g-partialdep-03$q$, 1032, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Coves Beverages has a December 31 year end. On May 1 it bought equipment for $4,260, with a 4-year life and a residual value of $300, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$660", "$990", "$710", "$578", "$743"]$q$::jsonb, 0, $q$($4,260 − $300) ÷ 4 = $990 a year, × 8/12 months owned = $660.$q$),
  ($q$g-partialdep-04$q$, 1033, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Coves Supply Ltd. has a December 31 year end. On July 1 it bought equipment for $4,860, with a 5-year life and a residual value of $100, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$476", "$952", "$486", "$397", "$555"]$q$::jsonb, 0, $q$($4,860 − $100) ÷ 5 = $952 a year, × 6/12 months owned = $476.$q$),
  ($q$g-partialdep-05$q$, 1034, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Huron Hill Sports Ltd. has a December 31 year end. On November 1 it bought equipment for $5,940, with a 5-year life and a residual value of $0, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$198", "$1,188", "$99", "$297", "$184"]$q$::jsonb, 0, $q$($5,940 − $0) ÷ 5 = $1,188 a year, × 2/12 months owned = $198.$q$),
  ($q$g-partialdep-06$q$, 1035, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Lakehead Goods Inc. has a December 31 year end. On November 1 it bought equipment for $2,700, with a 6-year life and a residual value of $300, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$67", "$400", "$75", "$33", "$100"]$q$::jsonb, 0, $q$($2,700 − $300) ÷ 6 = $400 a year, × 2/12 months owned = $67.$q$),
  ($q$g-partialdep-07$q$, 1036, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Lakehead Goods Inc. has a December 31 year end. On July 1 it bought equipment for $3,240, with a 4-year life and a residual value of $0, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$405", "$810", "$338", "$473", "$377"]$q$::jsonb, 0, $q$($3,240 − $0) ÷ 4 = $810 a year, × 6/12 months owned = $405.$q$),
  ($q$g-partialdep-08$q$, 1037, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Maple Ridge Supply Ltd. has a December 31 year end. On April 1 it bought equipment for $1,140, with a 4-year life and a residual value of $0, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$214", "$285", "$190", "$238", "$199"]$q$::jsonb, 0, $q$($1,140 − $0) ÷ 4 = $285 a year, × 9/12 months owned = $214.$q$),
  ($q$g-partialdep-09$q$, 1038, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Springbank Beverages has a December 31 year end. On November 1 it bought equipment for $5,940, with a 5-year life and a residual value of $0, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$198", "$1,188", "$99", "$297", "$184"]$q$::jsonb, 0, $q$($5,940 − $0) ÷ 5 = $1,188 a year, × 2/12 months owned = $198.$q$),
  ($q$g-partialdep-10$q$, 1039, $q$Tartan Loungewear$q$, $q$Depreciation$q$, $q$Coves Imports has a December 31 year end. On June 1 it bought equipment for $4,140, with a 6-year life and a residual value of $300, depreciated straight-line.

What is depreciation expense for this first year?$q$, $q$["$373", "$640", "$403", "$320", "$427"]$q$::jsonb, 0, $q$($4,140 − $300) ÷ 6 = $640 a year, × 7/12 months owned = $373.$q$),
  ($q$g-tax-01$q$, 1040, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Oakridge Tea Co.'s records for the year:
• Revenue $61,900
• Cost of goods sold $24,600
• Rent $6,900
• Other expenses $2,000
• Depreciation $930
• Dividends declared $5,000

Income tax is 20% of net income before tax. What is net income?$q$, $q$["$21,976", "$27,470", "$17,976", "$22,470", "$16,976"]$q$::jsonb, 0, $q$Net income before tax = $27,470; tax $5,494; net income $21,976. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-02$q$, 1041, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Wortley Imports's records for the year:
• Revenue $86,900
• Cost of goods sold $43,100
• Rent $10,800
• Other expenses $4,700
• Depreciation $440
• Dividends declared $2,500

Income tax is 15% of net income before tax. What is net income?$q$, $q$["$23,681", "$27,860", "$21,556", "$25,360", "$21,181"]$q$::jsonb, 0, $q$Net income before tax = $27,860; tax $4,179; net income $23,681. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-03$q$, 1042, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Kingsway Supply Ltd.'s records for the year:
• Revenue $67,500
• Cost of goods sold $24,700
• Rent $13,400
• Other expenses $6,200
• Depreciation $630
• Dividends declared $1,000

Income tax is 20% of net income before tax. What is net income?$q$, $q$["$18,056", "$22,570", "$17,256", "$21,570", "$17,056"]$q$::jsonb, 0, $q$Net income before tax = $22,570; tax $4,514; net income $18,056. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-04$q$, 1043, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Thames Valley Goods Inc.'s records for the year:
• Revenue $102,700
• Cost of goods sold $37,400
• Rent $13,100
• Other expenses $6,800
• Depreciation $650
• Dividends declared $4,000

Income tax is 15% of net income before tax. What is net income?$q$, $q$["$38,038", "$44,750", "$34,638", "$40,750", "$34,038"]$q$::jsonb, 0, $q$Net income before tax = $44,750; tax $6,713; net income $38,038. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-05$q$, 1044, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Stoney Creek Apparel's records for the year:
• Revenue $82,500
• Cost of goods sold $31,500
• Rent $9,000
• Other expenses $4,000
• Depreciation $1,420
• Dividends declared $4,000

Income tax is 12% of net income before tax. What is net income?$q$, $q$["$32,190", "$36,580", "$28,670", "$32,580", "$28,190"]$q$::jsonb, 0, $q$Net income before tax = $36,580; tax $4,390; net income $32,190. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-06$q$, 1045, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Glenview Outfitters's records for the year:
• Revenue $50,700
• Cost of goods sold $20,900
• Rent $9,900
• Other expenses $6,000
• Depreciation $900
• Dividends declared $4,500

Income tax is 12% of net income before tax. What is net income?$q$, $q$["$11,440", "$13,000", "$7,480", "$8,500", "$6,940"]$q$::jsonb, 0, $q$Net income before tax = $13,000; tax $1,560; net income $11,440. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-07$q$, 1046, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Thames Valley Outfitters's records for the year:
• Revenue $85,400
• Cost of goods sold $35,500
• Rent $11,700
• Other expenses $2,000
• Depreciation $230
• Dividends declared $2,500

Income tax is 14% of net income before tax. What is net income?$q$, $q$["$30,934", "$35,970", "$28,784", "$33,470", "$28,434"]$q$::jsonb, 0, $q$Net income before tax = $35,970; tax $5,036; net income $30,934. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-08$q$, 1047, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Wortley Supply Ltd.'s records for the year:
• Revenue $81,300
• Cost of goods sold $38,900
• Rent $10,200
• Other expenses $2,400
• Depreciation $1,090
• Dividends declared $5,500

Income tax is 15% of net income before tax. What is net income?$q$, $q$["$24,404", "$28,710", "$19,729", "$23,210", "$18,904"]$q$::jsonb, 0, $q$Net income before tax = $28,710; tax $4,307; net income $24,404. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-09$q$, 1048, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Byron Stationers's records for the year:
• Revenue $117,100
• Cost of goods sold $56,000
• Rent $12,600
• Other expenses $2,200
• Depreciation $1,050
• Dividends declared $3,500

Income tax is 15% of net income before tax. What is net income?$q$, $q$["$38,463", "$45,250", "$35,488", "$41,750", "$34,963"]$q$::jsonb, 0, $q$Net income before tax = $45,250; tax $6,788; net income $38,463. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-tax-10$q$, 1049, $q$Tartan Loungewear$q$, $q$Statement of earnings$q$, $q$Lakehead Tea Co.'s records for the year:
• Revenue $75,800
• Cost of goods sold $26,700
• Rent $8,900
• Other expenses $4,600
• Depreciation $880
• Dividends declared $1,000

Income tax is 12% of net income before tax. What is net income?$q$, $q$["$30,554", "$34,720", "$29,674", "$33,720", "$29,554"]$q$::jsonb, 0, $q$Net income before tax = $34,720; tax $4,166; net income $30,554. Dividends are not an expense and never appear on the statement of earnings.$q$),
  ($q$g-closing-01$q$, 1050, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Stoney Creek Outfitters has Revenue of $56,800, total expenses of $51,100, Dividends of $1,500 and opening Retained Earnings of $9,500. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$13,700; step 3: DR Income Summary, CR Retained Earnings $5,700", "$15,200; step 3: DR Income Summary, CR Retained Earnings $5,700", "$2,300; step 3: DR Retained Earnings, CR Income Summary $5,700", "$13,700; step 3: DR Retained Earnings, CR Income Summary $5,700", "$16,700; step 3: DR Income Summary, CR Retained Earnings $5,700"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $56,800 − $51,100 = $5,700 (profit). Step 3 moves it to Retained Earnings (DR Income Summary, CR Retained Earnings). Step 4 closes Dividends. Ending RE = $9,500 + $5,700 − $1,500 = $13,700.$q$),
  ($q$g-closing-02$q$, 1051, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Prairie Rose Stationers has Revenue of $48,500, total expenses of $52,600, Dividends of $500 and opening Retained Earnings of $15,000. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$10,400; step 3: DR Retained Earnings, CR Income Summary $4,100", "$10,900; step 3: DR Retained Earnings, CR Income Summary $4,100", "$18,600; step 3: DR Income Summary, CR Retained Earnings $4,100", "$10,400; step 3: DR Income Summary, CR Retained Earnings $4,100", "$11,400; step 3: DR Retained Earnings, CR Income Summary $4,100"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $48,500 − $52,600 = −$4,100 (loss). Step 3 moves it to Retained Earnings (DR Retained Earnings, CR Income Summary). Step 4 closes Dividends. Ending RE = $15,000 − $4,100 − $500 = $10,400.$q$),
  ($q$g-closing-03$q$, 1052, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Riverbend Supply Ltd. has Revenue of $27,600, total expenses of $32,700, Dividends of $0 and opening Retained Earnings of $28,700. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$23,600; step 3: DR Retained Earnings, CR Income Summary $5,100", "$33,800; step 3: DR Income Summary, CR Retained Earnings $5,100", "$23,600; step 3: DR Income Summary, CR Retained Earnings $5,100", "$21,948; step 3: DR Retained Earnings, CR Income Summary $5,100", "$26,904; step 3: DR Retained Earnings, CR Income Summary $5,100"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $27,600 − $32,700 = −$5,100 (loss). Step 3 moves it to Retained Earnings (DR Retained Earnings, CR Income Summary). Step 4 closes Dividends. Ending RE = $28,700 − $5,100 − $0 = $23,600.$q$),
  ($q$g-closing-04$q$, 1053, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Wortley Apparel has Revenue of $46,000, total expenses of $52,600, Dividends of $3,000 and opening Retained Earnings of $11,100. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$1,500; step 3: DR Retained Earnings, CR Income Summary $6,600", "$4,500; step 3: DR Retained Earnings, CR Income Summary $6,600", "$14,700; step 3: DR Income Summary, CR Retained Earnings $6,600", "$1,500; step 3: DR Income Summary, CR Retained Earnings $6,600", "$7,500; step 3: DR Retained Earnings, CR Income Summary $6,600"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $46,000 − $52,600 = −$6,600 (loss). Step 3 moves it to Retained Earnings (DR Retained Earnings, CR Income Summary). Step 4 closes Dividends. Ending RE = $11,100 − $6,600 − $3,000 = $1,500.$q$),
  ($q$g-closing-05$q$, 1054, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Wortley Goods Inc. has Revenue of $35,900, total expenses of $31,400, Dividends of $2,000 and opening Retained Earnings of $6,800. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$9,300; step 3: DR Income Summary, CR Retained Earnings $4,500", "$11,300; step 3: DR Income Summary, CR Retained Earnings $4,500", "$300; step 3: DR Retained Earnings, CR Income Summary $4,500", "$9,300; step 3: DR Retained Earnings, CR Income Summary $4,500", "$13,300; step 3: DR Income Summary, CR Retained Earnings $4,500"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $35,900 − $31,400 = $4,500 (profit). Step 3 moves it to Retained Earnings (DR Income Summary, CR Retained Earnings). Step 4 closes Dividends. Ending RE = $6,800 + $4,500 − $2,000 = $9,300.$q$),
  ($q$g-closing-06$q$, 1055, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Coves Apparel has Revenue of $33,700, total expenses of $29,700, Dividends of $500 and opening Retained Earnings of $10,900. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$14,400; step 3: DR Income Summary, CR Retained Earnings $4,000", "$14,900; step 3: DR Income Summary, CR Retained Earnings $4,000", "$6,400; step 3: DR Retained Earnings, CR Income Summary $4,000", "$14,400; step 3: DR Retained Earnings, CR Income Summary $4,000", "$15,400; step 3: DR Income Summary, CR Retained Earnings $4,000"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $33,700 − $29,700 = $4,000 (profit). Step 3 moves it to Retained Earnings (DR Income Summary, CR Retained Earnings). Step 4 closes Dividends. Ending RE = $10,900 + $4,000 − $500 = $14,400.$q$),
  ($q$g-closing-07$q$, 1056, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Talbot Imports has Revenue of $25,600, total expenses of $33,300, Dividends of $1,000 and opening Retained Earnings of $7,500. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["−$1,200; step 3: DR Retained Earnings, CR Income Summary $7,700", "−$200; step 3: DR Retained Earnings, CR Income Summary $7,700", "$14,200; step 3: DR Income Summary, CR Retained Earnings $7,700", "−$1,200; step 3: DR Income Summary, CR Retained Earnings $7,700", "$800; step 3: DR Retained Earnings, CR Income Summary $7,700"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $25,600 − $33,300 = −$7,700 (loss). Step 3 moves it to Retained Earnings (DR Retained Earnings, CR Income Summary). Step 4 closes Dividends. Ending RE = $7,500 − $7,700 − $1,000 = −$1,200.$q$),
  ($q$g-closing-08$q$, 1057, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Kingsway Stationers has Revenue of $35,900, total expenses of $38,800, Dividends of $1,000 and opening Retained Earnings of $14,300. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$10,400; step 3: DR Retained Earnings, CR Income Summary $2,900", "$11,400; step 3: DR Retained Earnings, CR Income Summary $2,900", "$16,200; step 3: DR Income Summary, CR Retained Earnings $2,900", "$10,400; step 3: DR Income Summary, CR Retained Earnings $2,900", "$12,400; step 3: DR Retained Earnings, CR Income Summary $2,900"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $35,900 − $38,800 = −$2,900 (loss). Step 3 moves it to Retained Earnings (DR Retained Earnings, CR Income Summary). Step 4 closes Dividends. Ending RE = $14,300 − $2,900 − $1,000 = $10,400.$q$),
  ($q$g-closing-09$q$, 1058, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Maple Ridge Beverages has Revenue of $23,900, total expenses of $21,100, Dividends of $3,500 and opening Retained Earnings of $21,500. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$20,800; step 3: DR Income Summary, CR Retained Earnings $2,800", "$24,300; step 3: DR Income Summary, CR Retained Earnings $2,800", "$15,200; step 3: DR Retained Earnings, CR Income Summary $2,800", "$20,800; step 3: DR Retained Earnings, CR Income Summary $2,800", "$27,800; step 3: DR Income Summary, CR Retained Earnings $2,800"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $23,900 − $21,100 = $2,800 (profit). Step 3 moves it to Retained Earnings (DR Income Summary, CR Retained Earnings). Step 4 closes Dividends. Ending RE = $21,500 + $2,800 − $3,500 = $20,800.$q$),
  ($q$g-closing-10$q$, 1059, $q$Tartan Loungewear$q$, $q$Closing entries$q$, $q$Before closing, Fanshawe Outfitters has Revenue of $38,200, total expenses of $31,100, Dividends of $2,000 and opening Retained Earnings of $16,200. All four closing entries are made.

What is ending Retained Earnings, and what is step 3?$q$, $q$["$21,300; step 3: DR Income Summary, CR Retained Earnings $7,100", "$23,300; step 3: DR Income Summary, CR Retained Earnings $7,100", "$7,100; step 3: DR Retained Earnings, CR Income Summary $7,100", "$21,300; step 3: DR Retained Earnings, CR Income Summary $7,100", "$25,300; step 3: DR Income Summary, CR Retained Earnings $7,100"]$q$::jsonb, 0, $q$Income Summary after steps 1–2 = $38,200 − $31,100 = $7,100 (profit). Step 3 moves it to Retained Earnings (DR Income Summary, CR Retained Earnings). Step 4 closes Dividends. Ending RE = $16,200 + $7,100 − $2,000 = $21,300.$q$),
  ($q$g-invplug-01$q$, 1060, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Fanshawe Sports Ltd. (year end May 31) had opening inventory of $2,500. It paid $27,100 cash for inventory during the year. Two orders were unpaid at year end:
• $2,340, received in April
• $1,290, shipped June 2 FOB shipping point

The May 31 count is $4,215. What is cost of goods sold?$q$, $q$["$27,725", "$29,015", "$22,885", "$25,385", "$25,225"]$q$::jsonb, 0, $q$Available = $2,500 + $27,100 + $2,340 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $27,725.$q$),
  ($q$g-invplug-02$q$, 1061, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Prairie Rose Sports Ltd. (year end May 31) had opening inventory of $2,650. It paid $22,200 cash for inventory during the year. Two orders were unpaid at year end:
• $2,370, received in April
• $1,470, shipped June 2 FOB shipping point

The May 31 count is $5,980. What is cost of goods sold?$q$, $q$["$21,240", "$22,710", "$16,220", "$18,870", "$18,590"]$q$::jsonb, 0, $q$Available = $2,650 + $22,200 + $2,370 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $21,240.$q$),
  ($q$g-invplug-03$q$, 1062, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Prairie Rose Beverages (year end May 31) had opening inventory of $0. It paid $23,300 cash for inventory during the year. Two orders were unpaid at year end:
• $2,690, received in April
• $1,050, shipped June 2 FOB shipping point

The May 31 count is $5,235. What is cost of goods sold?$q$, $q$["$20,755", "$21,805", "$18,065", "$19,302", "$23,661"]$q$::jsonb, 0, $q$Available = $0 + $23,300 + $2,690 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $20,755.$q$),
  ($q$g-invplug-04$q$, 1063, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Elgin Stationers (year end May 31) had opening inventory of $3,510. It paid $22,300 cash for inventory during the year. Two orders were unpaid at year end:
• $4,590, received in April
• $1,210, shipped June 2 FOB shipping point

The May 31 count is $3,825. What is cost of goods sold?$q$, $q$["$26,575", "$27,785", "$18,475", "$21,985", "$23,065"]$q$::jsonb, 0, $q$Available = $3,510 + $22,300 + $4,590 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $26,575.$q$),
  ($q$g-invplug-05$q$, 1064, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Springbank Stationers (year end May 31) had opening inventory of $0. It paid $24,800 cash for inventory during the year. Two orders were unpaid at year end:
• $4,170, received in April
• $1,440, shipped June 2 FOB shipping point

The May 31 count is $4,875. What is cost of goods sold?$q$, $q$["$24,095", "$25,535", "$19,925", "$22,408", "$27,468"]$q$::jsonb, 0, $q$Available = $0 + $24,800 + $4,170 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $24,095.$q$),
  ($q$g-invplug-06$q$, 1065, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Elgin Goods Inc. (year end May 31) had opening inventory of $0. It paid $35,800 cash for inventory during the year. Two orders were unpaid at year end:
• $4,670, received in April
• $530, shipped June 2 FOB shipping point

The May 31 count is $2,505. What is cost of goods sold?$q$, $q$["$37,965", "$38,495", "$33,295", "$35,307", "$43,280"]$q$::jsonb, 0, $q$Available = $0 + $35,800 + $4,670 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $37,965.$q$),
  ($q$g-invplug-07$q$, 1066, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Glenview Apparel (year end May 31) had opening inventory of $0. It paid $30,600 cash for inventory during the year. Two orders were unpaid at year end:
• $2,650, received in April
• $590, shipped June 2 FOB shipping point

The May 31 count is $2,990. What is cost of goods sold?$q$, $q$["$30,260", "$30,850", "$27,610", "$28,142", "$34,496"]$q$::jsonb, 0, $q$Available = $0 + $30,600 + $2,650 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $30,260.$q$),
  ($q$g-invplug-08$q$, 1067, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Byron Imports (year end May 31) had opening inventory of $0. It paid $25,000 cash for inventory during the year. Two orders were unpaid at year end:
• $4,790, received in April
• $670, shipped June 2 FOB shipping point

The May 31 count is $5,465. What is cost of goods sold?$q$, $q$["$24,325", "$24,995", "$19,535", "$22,622", "$27,731"]$q$::jsonb, 0, $q$Available = $0 + $25,000 + $4,790 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $24,325.$q$),
  ($q$g-invplug-09$q$, 1068, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Talbot Goods Inc. (year end May 31) had opening inventory of $0. It paid $26,100 cash for inventory during the year. Two orders were unpaid at year end:
• $4,470, received in April
• $1,450, shipped June 2 FOB shipping point

The May 31 count is $2,825. What is cost of goods sold?$q$, $q$["$27,745", "$29,195", "$23,275", "$25,803", "$31,629"]$q$::jsonb, 0, $q$Available = $0 + $26,100 + $4,470 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $27,745.$q$),
  ($q$g-invplug-10$q$, 1069, $q$Tartan Loungewear$q$, $q$Inventory and COGS$q$, $q$Northshore Supply Ltd. (year end May 31) had opening inventory of $0. It paid $35,200 cash for inventory during the year. Two orders were unpaid at year end:
• $2,820, received in April
• $1,350, shipped June 2 FOB shipping point

The May 31 count is $3,960. What is cost of goods sold?$q$, $q$["$34,060", "$35,410", "$31,240", "$31,676", "$38,828"]$q$::jsonb, 0, $q$Available = $0 + $35,200 + $2,820 (received, so owned). The June shipment wasn't owned at May 31. COGS = available − count = $34,060.$q$),
  ($q$g-afda-01$q$, 1070, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Springbank Outfitters opens the period with an Allowance for Doubtful Accounts of $3,740 (credit). During the period:
• Accounts of $446 and $2,130 were written off.
• A customer whose $580 account was written off last period paid 40% as final settlement.

The year-end aging schedule:
• Not yet due $17,470 at 2%
• 1–30 days overdue $5,280 at 5%
• 31–60 days overdue $3,850 at 15%
• 61–90 days overdue $1,070 at 40%
• Over 90 days $600 at 60%

What is Bad Debt Expense for the period?$q$, $q$["$583", "$1,979", "$815", "−$1,761", "$235"]$q$::jsonb, 0, $q$Required ending AFDA = $1,979. Pre-adjustment AFDA = $3,740 − $446 − $2,130 + recovery $232 = $1,396. Bad Debt Expense is the plug: $583.$q$),
  ($q$g-netar-01$q$, 1071, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Fanshawe Supply Ltd. opens the period with an Allowance for Doubtful Accounts of $3,950 (credit). During the period:
• Accounts of $564 and $2,384 were written off.
• A customer whose $1,350 account was written off last period paid 25% as final settlement.

The year-end aging schedule:
• Not yet due $14,130 at 1%
• 1–30 days overdue $8,420 at 4%
• 31–60 days overdue $2,630 at 20%
• 61–90 days overdue $1,000 at 25%
• Over 90 days $100 at 75%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$24,951", "$26,280", "$24,941", "$26,290", "$22,330"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,329, whatever the opening balance or write-offs. Net A/R = $26,280 − $1,329 = $24,951.$q$),
  ($q$g-afda-02$q$, 1072, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Birchwood Outfitters opens the period with an Allowance for Doubtful Accounts of $2,670 (credit). During the period:
• Accounts of $238 and $1,068 were written off.
• A customer whose $860 account was written off last period paid 20% as final settlement.

The year-end aging schedule:
• Not yet due $23,690 at 3%
• 1–30 days overdue $7,150 at 4%
• 31–60 days overdue $2,420 at 20%
• 61–90 days overdue $750 at 40%
• Over 90 days $470 at 60%

What is Bad Debt Expense for the period?$q$, $q$["$527", "$2,063", "$699", "−$607", "−$161"]$q$::jsonb, 0, $q$Required ending AFDA = $2,063. Pre-adjustment AFDA = $2,670 − $238 − $1,068 + recovery $172 = $1,536. Bad Debt Expense is the plug: $527.$q$),
  ($q$g-netar-02$q$, 1073, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Cedar Lane Goods Inc. opens the period with an Allowance for Doubtful Accounts of $2,020 (credit). During the period:
• Accounts of $360 and $2,048 were written off.
• A customer whose $1,240 account was written off last period paid 50% as final settlement.

The year-end aging schedule:
• Not yet due $23,770 at 1%
• 1–30 days overdue $6,920 at 4%
• 31–60 days overdue $3,350 at 20%
• 61–90 days overdue $1,480 at 40%
• Over 90 days $260 at 60%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$33,848", "$35,780", "$35,548", "$34,080", "$33,760"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,933, whatever the opening balance or write-offs. Net A/R = $35,780 − $1,933 = $33,848.$q$),
  ($q$g-afda-03$q$, 1074, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Byron Beverages opens the period with an Allowance for Doubtful Accounts of $3,530 (credit). During the period:
• Accounts of $428 and $2,180 were written off.
• A customer whose $1,410 account was written off last period paid 40% as final settlement.

The year-end aging schedule:
• Not yet due $21,460 at 3%
• 1–30 days overdue $6,370 at 6%
• 31–60 days overdue $2,470 at 15%
• 61–90 days overdue $1,060 at 25%
• Over 90 days $500 at 75%

What is Bad Debt Expense for the period?$q$, $q$["$551", "$2,037", "$1,115", "−$1,494", "−$296"]$q$::jsonb, 0, $q$Required ending AFDA = $2,037. Pre-adjustment AFDA = $3,530 − $428 − $2,180 + recovery $564 = $1,486. Bad Debt Expense is the plug: $551.$q$),
  ($q$g-netar-03$q$, 1075, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Oakridge Sports Ltd. opens the period with an Allowance for Doubtful Accounts of $2,080 (credit). During the period:
• Accounts of $214 and $1,088 were written off.
• A customer whose $850 account was written off last period paid 20% as final settlement.

The year-end aging schedule:
• Not yet due $22,310 at 2%
• 1–30 days overdue $6,530 at 4%
• 31–60 days overdue $3,350 at 15%
• 61–90 days overdue $1,360 at 30%
• Over 90 days $690 at 50%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$32,277", "$34,240", "$33,292", "$33,225", "$32,160"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,963, whatever the opening balance or write-offs. Net A/R = $34,240 − $1,963 = $32,277.$q$),
  ($q$g-afda-04$q$, 1076, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Harbourview Beverages opens the period with an Allowance for Doubtful Accounts of $2,220 (credit). During the period:
• Accounts of $530 and $1,540 were written off.
• A customer whose $1,280 account was written off last period paid 20% as final settlement.

The year-end aging schedule:
• Not yet due $15,330 at 1%
• 1–30 days overdue $7,790 at 6%
• 31–60 days overdue $2,410 at 10%
• 61–90 days overdue $1,200 at 40%
• Over 90 days $630 at 60%

What is Bad Debt Expense for the period?$q$, $q$["$1,314", "$1,720", "$1,570", "−$500", "$290"]$q$::jsonb, 0, $q$Required ending AFDA = $1,720. Pre-adjustment AFDA = $2,220 − $530 − $1,540 + recovery $256 = $406. Bad Debt Expense is the plug: $1,314.$q$),
  ($q$g-netar-04$q$, 1077, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Fanshawe Stationers opens the period with an Allowance for Doubtful Accounts of $3,040 (credit). During the period:
• Accounts of $670 and $804 were written off.
• A customer whose $1,130 account was written off last period paid 30% as final settlement.

The year-end aging schedule:
• Not yet due $17,010 at 1%
• 1–30 days overdue $8,550 at 5%
• 31–60 days overdue $3,900 at 15%
• 61–90 days overdue $770 at 40%
• Over 90 days $160 at 60%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$28,803", "$30,390", "$28,485", "$30,708", "$27,350"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,587, whatever the opening balance or write-offs. Net A/R = $30,390 − $1,587 = $28,803.$q$),
  ($q$g-afda-05$q$, 1078, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Coves Tea Co. opens the period with an Allowance for Doubtful Accounts of $3,700 (credit). During the period:
• Accounts of $586 and $1,982 were written off.
• A customer whose $1,130 account was written off last period paid 50% as final settlement.

The year-end aging schedule:
• Not yet due $24,230 at 3%
• 1–30 days overdue $6,640 at 4%
• 31–60 days overdue $3,000 at 20%
• 61–90 days overdue $1,270 at 40%
• Over 90 days $320 at 50%

What is Bad Debt Expense for the period?$q$, $q$["$564", "$2,261", "$1,129", "−$1,440", "−$2"]$q$::jsonb, 0, $q$Required ending AFDA = $2,261. Pre-adjustment AFDA = $3,700 − $586 − $1,982 + recovery $565 = $1,697. Bad Debt Expense is the plug: $564.$q$),
  ($q$g-netar-05$q$, 1079, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Fanshawe Supply Ltd. opens the period with an Allowance for Doubtful Accounts of $3,620 (credit). During the period:
• Accounts of $530 and $2,214 were written off.
• A customer whose $880 account was written off last period paid 40% as final settlement.

The year-end aging schedule:
• Not yet due $24,590 at 1%
• 1–30 days overdue $4,230 at 5%
• 31–60 days overdue $2,490 at 20%
• 61–90 days overdue $980 at 30%
• Over 90 days $280 at 75%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$31,111", "$32,570", "$31,342", "$32,339", "$28,950"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,459, whatever the opening balance or write-offs. Net A/R = $32,570 − $1,459 = $31,111.$q$),
  ($q$g-afda-06$q$, 1080, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Hyde Park Print Shop opens the period with an Allowance for Doubtful Accounts of $2,650 (credit). During the period:
• Accounts of $332 and $2,228 were written off.
• A customer whose $1,090 account was written off last period paid 40% as final settlement.

The year-end aging schedule:
• Not yet due $23,730 at 1%
• 1–30 days overdue $7,720 at 5%
• 31–60 days overdue $2,160 at 10%
• 61–90 days overdue $1,360 at 40%
• Over 90 days $360 at 50%

What is Bad Debt Expense for the period?$q$, $q$["$1,037", "$1,563", "$1,473", "−$1,087", "$383"]$q$::jsonb, 0, $q$Required ending AFDA = $1,563. Pre-adjustment AFDA = $2,650 − $332 − $2,228 + recovery $436 = $526. Bad Debt Expense is the plug: $1,037.$q$),
  ($q$g-netar-06$q$, 1081, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Elgin Sports Ltd. opens the period with an Allowance for Doubtful Accounts of $2,370 (credit). During the period:
• Accounts of $264 and $810 were written off.
• A customer whose $1,310 account was written off last period paid 50% as final settlement.

The year-end aging schedule:
• Not yet due $12,990 at 2%
• 1–30 days overdue $5,750 at 4%
• 31–60 days overdue $3,950 at 10%
• 61–90 days overdue $830 at 40%
• Over 90 days $430 at 50%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$22,518", "$23,950", "$21,999", "$24,469", "$21,580"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,432, whatever the opening balance or write-offs. Net A/R = $23,950 − $1,432 = $22,518.$q$),
  ($q$g-afda-07$q$, 1082, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Cedar Lane Goods Inc. opens the period with an Allowance for Doubtful Accounts of $3,090 (credit). During the period:
• Accounts of $262 and $1,674 were written off.
• A customer whose $720 account was written off last period paid 30% as final settlement.

The year-end aging schedule:
• Not yet due $22,590 at 1%
• 1–30 days overdue $8,500 at 6%
• 31–60 days overdue $1,650 at 20%
• 61–90 days overdue $560 at 30%
• Over 90 days $520 at 75%

What is Bad Debt Expense for the period?$q$, $q$["$254", "$1,624", "$470", "−$1,466", "−$250"]$q$::jsonb, 0, $q$Required ending AFDA = $1,624. Pre-adjustment AFDA = $3,090 − $262 − $1,674 + recovery $216 = $1,370. Bad Debt Expense is the plug: $254.$q$),
  ($q$g-netar-07$q$, 1083, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Huron Hill Tea Co. opens the period with an Allowance for Doubtful Accounts of $3,710 (credit). During the period:
• Accounts of $614 and $2,116 were written off.
• A customer whose $650 account was written off last period paid 20% as final settlement.

The year-end aging schedule:
• Not yet due $12,490 at 2%
• 1–30 days overdue $6,040 at 5%
• 31–60 days overdue $1,870 at 15%
• 61–90 days overdue $1,390 at 25%
• Over 90 days $740 at 60%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$20,906", "$22,530", "$21,420", "$22,016", "$18,820"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,624, whatever the opening balance or write-offs. Net A/R = $22,530 − $1,624 = $20,906.$q$),
  ($q$g-afda-08$q$, 1084, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Riverbend Tea Co. opens the period with an Allowance for Doubtful Accounts of $3,760 (credit). During the period:
• Accounts of $530 and $2,280 were written off.
• A customer whose $1,340 account was written off last period paid 30% as final settlement.

The year-end aging schedule:
• Not yet due $17,350 at 1%
• 1–30 days overdue $5,850 at 5%
• 31–60 days overdue $3,670 at 10%
• 61–90 days overdue $980 at 30%
• Over 90 days $460 at 60%

What is Bad Debt Expense for the period?$q$, $q$["$51", "$1,403", "$453", "−$2,357", "−$887"]$q$::jsonb, 0, $q$Required ending AFDA = $1,403. Pre-adjustment AFDA = $3,760 − $530 − $2,280 + recovery $402 = $1,352. Bad Debt Expense is the plug: $51.$q$),
  ($q$g-netar-08$q$, 1085, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Hyde Park Tea Co. opens the period with an Allowance for Doubtful Accounts of $2,270 (credit). During the period:
• Accounts of $678 and $2,370 were written off.
• A customer whose $1,440 account was written off last period paid 50% as final settlement.

The year-end aging schedule:
• Not yet due $14,400 at 1%
• 1–30 days overdue $6,520 at 6%
• 31–60 days overdue $3,720 at 20%
• 61–90 days overdue $730 at 30%
• Over 90 days $430 at 50%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$24,087", "$25,800", "$25,858", "$24,029", "$23,530"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,713, whatever the opening balance or write-offs. Net A/R = $25,800 − $1,713 = $24,087.$q$),
  ($q$g-afda-09$q$, 1086, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Thames Valley Apparel opens the period with an Allowance for Doubtful Accounts of $3,010 (credit). During the period:
• Accounts of $390 and $892 were written off.
• A customer whose $650 account was written off last period paid 30% as final settlement.

The year-end aging schedule:
• Not yet due $24,240 at 3%
• 1–30 days overdue $6,500 at 5%
• 31–60 days overdue $1,630 at 20%
• 61–90 days overdue $1,070 at 40%
• Over 90 days $340 at 50%

What is Bad Debt Expense for the period?$q$, $q$["$53", "$1,976", "$248", "−$1,034", "−$402"]$q$::jsonb, 0, $q$Required ending AFDA = $1,976. Pre-adjustment AFDA = $3,010 − $390 − $892 + recovery $195 = $1,923. Bad Debt Expense is the plug: $53.$q$),
  ($q$g-netar-09$q$, 1087, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Birchwood Goods Inc. opens the period with an Allowance for Doubtful Accounts of $3,030 (credit). During the period:
• Accounts of $638 and $1,224 were written off.
• A customer whose $1,040 account was written off last period paid 50% as final settlement.

The year-end aging schedule:
• Not yet due $13,860 at 1%
• 1–30 days overdue $6,130 at 4%
• 31–60 days overdue $3,970 at 10%
• 61–90 days overdue $1,390 at 30%
• Over 90 days $370 at 75%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$24,245", "$25,720", "$24,032", "$25,933", "$22,690"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,475, whatever the opening balance or write-offs. Net A/R = $25,720 − $1,475 = $24,245.$q$),
  ($q$g-afda-10$q$, 1088, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Northshore Sports Ltd. opens the period with an Allowance for Doubtful Accounts of $3,550 (credit). During the period:
• Accounts of $218 and $1,712 were written off.
• A customer whose $970 account was written off last period paid 50% as final settlement.

The year-end aging schedule:
• Not yet due $22,810 at 2%
• 1–30 days overdue $4,980 at 4%
• 31–60 days overdue $2,490 at 10%
• 61–90 days overdue $820 at 25%
• Over 90 days $650 at 60%

What is Bad Debt Expense for the period?$q$, $q$["−$606", "$1,499", "−$121", "−$2,051", "−$1,091"]$q$::jsonb, 0, $q$Required ending AFDA = $1,499. Pre-adjustment AFDA = $3,550 − $218 − $1,712 + recovery $485 = $2,105. Bad Debt Expense is the plug: −$606.$q$),
  ($q$g-netar-10$q$, 1089, $q$Foote's Print & Design$q$, $q$Allowance for doubtful accounts$q$, $q$Huron Hill Print Shop opens the period with an Allowance for Doubtful Accounts of $1,680 (credit). During the period:
• Accounts of $322 and $1,756 were written off.
• A customer whose $980 account was written off last period paid 30% as final settlement.

The year-end aging schedule:
• Not yet due $16,210 at 2%
• 1–30 days overdue $4,180 at 6%
• 31–60 days overdue $1,850 at 15%
• 61–90 days overdue $1,470 at 40%
• Over 90 days $260 at 75%

What is the net realizable value of accounts receivable after adjusting?$q$, $q$["$22,335", "$23,970", "$24,074", "$22,231", "$22,290"]$q$::jsonb, 0, $q$After the adjustment AFDA equals the aging requirement, $1,636, whatever the opening balance or write-offs. Net A/R = $23,970 − $1,636 = $22,335.$q$),
  ($q$g-arroll-01$q$, 1090, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Cedar Lane Outfitters's six months:
• Opening accounts receivable $26,455
• Credit sales $28,605
• Cash collected on account $25,073 (before discounts)
• Discounts taken by customers $255
• Accounts written off $545
• Allowances granted $55
• An account of $990 converted to a note receivable
• A recovery of $115 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$28,142", "$29,132", "$28,257", "$28,027", "$28,397"]$q$::jsonb, 0, $q$$26,455 + $28,605 − $25,073 − $255 − $545 − $55 − $990 = $28,142. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-02$q$, 1091, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Wortley Apparel's six months:
• Opening accounts receivable $21,030
• Credit sales $59,765
• Cash collected on account $53,985 (before discounts)
• Discounts taken by customers $625
• Accounts written off $1,540
• Allowances granted $190
• An account of $755 converted to a note receivable
• A recovery of $190 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$23,700", "$24,455", "$23,890", "$23,510", "$24,325"]$q$::jsonb, 0, $q$$21,030 + $59,765 − $53,985 − $625 − $1,540 − $190 − $755 = $23,700. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-03$q$, 1092, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Masonville Print Shop's six months:
• Opening accounts receivable $26,805
• Credit sales $44,355
• Cash collected on account $40,463 (before discounts)
• Discounts taken by customers $815
• Accounts written off $2,190
• Allowances granted $135
• An account of $580 converted to a note receivable
• A recovery of $190 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$26,977", "$27,557", "$27,167", "$26,787", "$27,792"]$q$::jsonb, 0, $q$$26,805 + $44,355 − $40,463 − $815 − $2,190 − $135 − $580 = $26,977. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-04$q$, 1093, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Fanshawe Tea Co.'s six months:
• Opening accounts receivable $27,910
• Credit sales $39,225
• Cash collected on account $30,807 (before discounts)
• Discounts taken by customers $390
• Accounts written off $2,055
• Allowances granted $65
• An account of $520 converted to a note receivable
• A recovery of $120 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$33,298", "$33,818", "$33,418", "$33,178", "$33,688"]$q$::jsonb, 0, $q$$27,910 + $39,225 − $30,807 − $390 − $2,055 − $65 − $520 = $33,298. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-05$q$, 1094, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Northshore Beverages's six months:
• Opening accounts receivable $38,630
• Credit sales $46,410
• Cash collected on account $34,936 (before discounts)
• Discounts taken by customers $695
• Accounts written off $1,175
• Allowances granted $50
• An account of $485 converted to a note receivable
• A recovery of $290 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$47,699", "$48,184", "$47,989", "$47,409", "$48,394"]$q$::jsonb, 0, $q$$38,630 + $46,410 − $34,936 − $695 − $1,175 − $50 − $485 = $47,699. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-06$q$, 1095, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Coves Apparel's six months:
• Opening accounts receivable $24,835
• Credit sales $47,885
• Cash collected on account $40,609 (before discounts)
• Discounts taken by customers $635
• Accounts written off $745
• Allowances granted $200
• An account of $1,425 converted to a note receivable
• A recovery of $195 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$29,106", "$30,531", "$29,301", "$28,911", "$29,741"]$q$::jsonb, 0, $q$$24,835 + $47,885 − $40,609 − $635 − $745 − $200 − $1,425 = $29,106. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-07$q$, 1096, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Lakehead Supply Ltd.'s six months:
• Opening accounts receivable $20,970
• Credit sales $55,835
• Cash collected on account $48,404 (before discounts)
• Discounts taken by customers $270
• Accounts written off $1,520
• Allowances granted $240
• An account of $1,080 converted to a note receivable
• A recovery of $345 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$25,291", "$26,371", "$25,636", "$24,946", "$25,561"]$q$::jsonb, 0, $q$$20,970 + $55,835 − $48,404 − $270 − $1,520 − $240 − $1,080 = $25,291. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-08$q$, 1097, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Lakehead Tea Co.'s six months:
• Opening accounts receivable $26,735
• Credit sales $49,505
• Cash collected on account $38,123 (before discounts)
• Discounts taken by customers $340
• Accounts written off $1,505
• Allowances granted $280
• An account of $590 converted to a note receivable
• A recovery of $355 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$35,402", "$35,992", "$35,757", "$35,047", "$35,742"]$q$::jsonb, 0, $q$$26,735 + $49,505 − $38,123 − $340 − $1,505 − $280 − $590 = $35,402. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-09$q$, 1098, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Hyde Park Imports's six months:
• Opening accounts receivable $39,690
• Credit sales $31,675
• Cash collected on account $29,677 (before discounts)
• Discounts taken by customers $700
• Accounts written off $2,010
• Allowances granted $220
• An account of $1,440 converted to a note receivable
• A recovery of $170 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$37,318", "$38,758", "$37,488", "$37,148", "$38,018"]$q$::jsonb, 0, $q$$39,690 + $31,675 − $29,677 − $700 − $2,010 − $220 − $1,440 = $37,318. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-arroll-10$q$, 1099, $q$Foote's Print & Design$q$, $q$Accounts receivable$q$, $q$For Birchwood Tea Co.'s six months:
• Opening accounts receivable $31,700
• Credit sales $58,565
• Cash collected on account $51,825 (before discounts)
• Discounts taken by customers $690
• Accounts written off $1,545
• Allowances granted $290
• An account of $770 converted to a note receivable
• A recovery of $130 on an account written off last year (reinstated, then collected)

What is the ending balance of accounts receivable?$q$, $q$["$35,145", "$35,915", "$35,275", "$35,015", "$35,835"]$q$::jsonb, 0, $q$$31,700 + $58,565 − $51,825 − $690 − $1,545 − $290 − $770 = $35,145. The recovery goes through A/R in both directions (reinstate, then collect), so it nets to zero.$q$),
  ($q$g-note-01$q$, 1100, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Stoney Creek Stationers converts a customer's $2,200 overdue account into a 4-month, 12% note. At year end, 1 month of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $2,288.00, CR Notes Receivable $2,200, CR Interest Receivable $22.00, CR Interest Revenue $66.00", "DR Cash $2,288.00, CR Notes Receivable $2,200, CR Interest Receivable $0.00, CR Interest Revenue $88.00", "DR Cash $2,288.00, CR Notes Receivable $2,200, CR Interest Receivable $22.00, CR Interest Revenue $88.00", "DR Cash $2,464.00, CR Notes Receivable $2,200, CR Interest Receivable $22.00, CR Interest Revenue $242.00", "DR Cash $2,288.00, CR Notes Receivable $2,200, CR Interest Receivable $66.00, CR Interest Revenue $22.00"]$q$::jsonb, 0, $q$Total interest = $2,200 × 12% × 4/12 = $88.00. $22.00 was accrued last year (Interest Receivable); the remaining $66.00 is this year's revenue.$q$),
  ($q$g-note-02$q$, 1101, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Byron Imports converts a customer's $1,400 overdue account into a 3-month, 12% note. At year end, 1 month of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $1,442.00, CR Notes Receivable $1,400, CR Interest Receivable $14.00, CR Interest Revenue $28.00", "DR Cash $1,442.00, CR Notes Receivable $1,400, CR Interest Receivable $0.00, CR Interest Revenue $42.00", "DR Cash $1,442.00, CR Notes Receivable $1,400, CR Interest Receivable $14.00, CR Interest Revenue $42.00", "DR Cash $1,568.00, CR Notes Receivable $1,400, CR Interest Receivable $14.00, CR Interest Revenue $154.00", "DR Cash $1,442.00, CR Notes Receivable $1,400, CR Interest Receivable $28.00, CR Interest Revenue $14.00"]$q$::jsonb, 0, $q$Total interest = $1,400 × 12% × 3/12 = $42.00. $14.00 was accrued last year (Interest Receivable); the remaining $28.00 is this year's revenue.$q$),
  ($q$g-note-03$q$, 1102, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Glenview Print Shop converts a customer's $2,300 overdue account into a 4-month, 10% note. At year end, 1 month of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $2,376.67, CR Notes Receivable $2,300, CR Interest Receivable $19.17, CR Interest Revenue $57.50", "DR Cash $2,376.67, CR Notes Receivable $2,300, CR Interest Receivable $0.00, CR Interest Revenue $76.67", "DR Cash $2,376.67, CR Notes Receivable $2,300, CR Interest Receivable $19.17, CR Interest Revenue $76.67", "DR Cash $2,530.00, CR Notes Receivable $2,300, CR Interest Receivable $19.17, CR Interest Revenue $210.83", "DR Cash $2,376.67, CR Notes Receivable $2,300, CR Interest Receivable $57.50, CR Interest Revenue $19.17"]$q$::jsonb, 0, $q$Total interest = $2,300 × 10% × 4/12 = $76.67. $19.17 was accrued last year (Interest Receivable); the remaining $57.50 is this year's revenue.$q$),
  ($q$g-note-04$q$, 1103, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Fanshawe Apparel converts a customer's $2,600 overdue account into a 3-month, 9% note. At year end, 1 month of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $2,658.50, CR Notes Receivable $2,600, CR Interest Receivable $19.50, CR Interest Revenue $39.00", "DR Cash $2,658.50, CR Notes Receivable $2,600, CR Interest Receivable $0.00, CR Interest Revenue $58.50", "DR Cash $2,658.50, CR Notes Receivable $2,600, CR Interest Receivable $19.50, CR Interest Revenue $58.50", "DR Cash $2,834.00, CR Notes Receivable $2,600, CR Interest Receivable $19.50, CR Interest Revenue $214.50", "DR Cash $2,658.50, CR Notes Receivable $2,600, CR Interest Receivable $39.00, CR Interest Revenue $19.50"]$q$::jsonb, 0, $q$Total interest = $2,600 × 9% × 3/12 = $58.50. $19.50 was accrued last year (Interest Receivable); the remaining $39.00 is this year's revenue.$q$),
  ($q$g-note-05$q$, 1104, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Riverbend Stationers converts a customer's $1,000 overdue account into a 6-month, 12% note. At year end, 3 months of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $1,060.00, CR Notes Receivable $1,000, CR Interest Receivable $30.00, CR Interest Revenue $30.00", "DR Cash $1,060.00, CR Notes Receivable $1,000, CR Interest Receivable $0.00, CR Interest Revenue $60.00", "DR Cash $1,060.00, CR Notes Receivable $1,000, CR Interest Receivable $30.00, CR Interest Revenue $60.00", "DR Cash $1,120.00, CR Notes Receivable $1,000, CR Interest Receivable $30.00, CR Interest Revenue $90.00", "DR Cash $1,030.00, CR Notes Receivable $1,000, CR Interest Receivable $30.00, CR Interest Revenue $0.00"]$q$::jsonb, 0, $q$Total interest = $1,000 × 12% × 6/12 = $60.00. $30.00 was accrued last year (Interest Receivable); the remaining $30.00 is this year's revenue.$q$),
  ($q$g-note-06$q$, 1105, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Birchwood Outfitters converts a customer's $1,000 overdue account into a 6-month, 6% note. At year end, 5 months of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $1,030.00, CR Notes Receivable $1,000, CR Interest Receivable $25.00, CR Interest Revenue $5.00", "DR Cash $1,030.00, CR Notes Receivable $1,000, CR Interest Receivable $0.00, CR Interest Revenue $30.00", "DR Cash $1,030.00, CR Notes Receivable $1,000, CR Interest Receivable $25.00, CR Interest Revenue $30.00", "DR Cash $1,060.00, CR Notes Receivable $1,000, CR Interest Receivable $25.00, CR Interest Revenue $35.00", "DR Cash $1,030.00, CR Notes Receivable $1,000, CR Interest Receivable $5.00, CR Interest Revenue $25.00"]$q$::jsonb, 0, $q$Total interest = $1,000 × 6% × 6/12 = $30.00. $25.00 was accrued last year (Interest Receivable); the remaining $5.00 is this year's revenue.$q$),
  ($q$g-note-07$q$, 1106, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Lakehead Apparel converts a customer's $800 overdue account into a 3-month, 12% note. At year end, 2 months of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $824.00, CR Notes Receivable $800, CR Interest Receivable $16.00, CR Interest Revenue $8.00", "DR Cash $824.00, CR Notes Receivable $800, CR Interest Receivable $0.00, CR Interest Revenue $24.00", "DR Cash $824.00, CR Notes Receivable $800, CR Interest Receivable $16.00, CR Interest Revenue $24.00", "DR Cash $896.00, CR Notes Receivable $800, CR Interest Receivable $16.00, CR Interest Revenue $80.00", "DR Cash $824.00, CR Notes Receivable $800, CR Interest Receivable $8.00, CR Interest Revenue $16.00"]$q$::jsonb, 0, $q$Total interest = $800 × 12% × 3/12 = $24.00. $16.00 was accrued last year (Interest Receivable); the remaining $8.00 is this year's revenue.$q$),
  ($q$g-note-08$q$, 1107, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Kingsway Outfitters converts a customer's $2,900 overdue account into a 4-month, 12% note. At year end, 3 months of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $3,016.00, CR Notes Receivable $2,900, CR Interest Receivable $87.00, CR Interest Revenue $29.00", "DR Cash $3,016.00, CR Notes Receivable $2,900, CR Interest Receivable $0.00, CR Interest Revenue $116.00", "DR Cash $3,016.00, CR Notes Receivable $2,900, CR Interest Receivable $87.00, CR Interest Revenue $116.00", "DR Cash $3,248.00, CR Notes Receivable $2,900, CR Interest Receivable $87.00, CR Interest Revenue $261.00", "DR Cash $3,016.00, CR Notes Receivable $2,900, CR Interest Receivable $29.00, CR Interest Revenue $87.00"]$q$::jsonb, 0, $q$Total interest = $2,900 × 12% × 4/12 = $116.00. $87.00 was accrued last year (Interest Receivable); the remaining $29.00 is this year's revenue.$q$),
  ($q$g-note-09$q$, 1108, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Harbourview Supply Ltd. converts a customer's $2,900 overdue account into a 6-month, 9% note. At year end, 4 months of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $3,030.50, CR Notes Receivable $2,900, CR Interest Receivable $87.00, CR Interest Revenue $43.50", "DR Cash $3,030.50, CR Notes Receivable $2,900, CR Interest Receivable $0.00, CR Interest Revenue $130.50", "DR Cash $3,030.50, CR Notes Receivable $2,900, CR Interest Receivable $87.00, CR Interest Revenue $130.50", "DR Cash $3,161.00, CR Notes Receivable $2,900, CR Interest Receivable $87.00, CR Interest Revenue $174.00", "DR Cash $3,030.50, CR Notes Receivable $2,900, CR Interest Receivable $43.50, CR Interest Revenue $87.00"]$q$::jsonb, 0, $q$Total interest = $2,900 × 9% × 6/12 = $130.50. $87.00 was accrued last year (Interest Receivable); the remaining $43.50 is this year's revenue.$q$),
  ($q$g-note-10$q$, 1109, $q$Foote's Print & Design$q$, $q$Notes receivable$q$, $q$Coves Supply Ltd. converts a customer's $1,900 overdue account into a 6-month, 10% note. At year end, 5 months of interest had been accrued. The customer pays in full at maturity.

What is the maturity entry?$q$, $q$["DR Cash $1,995.00, CR Notes Receivable $1,900, CR Interest Receivable $79.17, CR Interest Revenue $15.83", "DR Cash $1,995.00, CR Notes Receivable $1,900, CR Interest Receivable $0.00, CR Interest Revenue $95.00", "DR Cash $1,995.00, CR Notes Receivable $1,900, CR Interest Receivable $79.17, CR Interest Revenue $95.00", "DR Cash $2,090.00, CR Notes Receivable $1,900, CR Interest Receivable $79.17, CR Interest Revenue $110.83", "DR Cash $1,995.00, CR Notes Receivable $1,900, CR Interest Receivable $15.83, CR Interest Revenue $79.17"]$q$::jsonb, 0, $q$Total interest = $1,900 × 10% × 6/12 = $95.00. $79.17 was accrued last year (Interest Receivable); the remaining $15.83 is this year's revenue.$q$),
  ($q$g-discount-01$q$, 1110, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Prairie Rose Apparel sells $3,700 on credit on June 1, terms 5/15, n/45. On June 3 it gives a $370 allowance for a defect. The customer pays on June 7. Discounts are on the invoice net of returns and allowances.

How much cash does Prairie Rose Apparel receive?$q$, $q$["$3,163.50", "$3,515.00", "$3,330.00", "$3,700.00", "$3,145.00"]$q$::jsonb, 0, $q$Balance after the allowance = $3,330. Paid within the 15-day window, so the discount is $166.50. Cash = $3,163.50.$q$),
  ($q$g-discount-02$q$, 1111, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Northshore Stationers sells $5,750 on credit on June 1, terms 5/15, n/45. On June 3 it gives a $190 allowance for a defect. The customer pays on June 9. Discounts are on the invoice net of returns and allowances.

How much cash does Northshore Stationers receive?$q$, $q$["$5,282.00", "$5,462.50", "$5,560.00", "$5,750.00", "$5,272.50"]$q$::jsonb, 0, $q$Balance after the allowance = $5,560. Paid within the 15-day window, so the discount is $278.00. Cash = $5,282.00.$q$),
  ($q$g-discount-03$q$, 1112, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Hyde Park Print Shop sells $4,630 on credit on June 1, terms 4/10, n/45. On June 3 it gives a $280 allowance for a defect. The customer pays on June 16. Discounts are on the invoice net of returns and allowances.

How much cash does Hyde Park Print Shop receive?$q$, $q$["$4,350.00", "$4,444.80", "$4,176.00", "$4,630.00", "$4,164.80"]$q$::jsonb, 0, $q$Balance after the allowance = $4,350. Paid outside the 10-day window, so the discount is $0.00. Cash = $4,350.00.$q$),
  ($q$g-discount-04$q$, 1113, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Wortley Apparel sells $3,300 on credit on June 1, terms 2/15, n/45. On June 3 it gives a $360 allowance for a defect. The customer pays on June 20. Discounts are on the invoice net of returns and allowances.

How much cash does Wortley Apparel receive?$q$, $q$["$2,940.00", "$3,234.00", "$2,881.20", "$3,300.00", "$2,874.00"]$q$::jsonb, 0, $q$Balance after the allowance = $2,940. Paid outside the 15-day window, so the discount is $0.00. Cash = $2,940.00.$q$),
  ($q$g-discount-05$q$, 1114, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Maple Ridge Supply Ltd. sells $3,040 on credit on June 1, terms 4/10, n/45. On June 3 it gives a $60 allowance for a defect. The customer pays on June 15. Discounts are on the invoice net of returns and allowances.

How much cash does Maple Ridge Supply Ltd. receive?$q$, $q$["$2,980.00", "$2,918.40", "$2,860.80", "$3,040.00", "$2,858.40"]$q$::jsonb, 0, $q$Balance after the allowance = $2,980. Paid outside the 10-day window, so the discount is $0.00. Cash = $2,980.00.$q$),
  ($q$g-discount-06$q$, 1115, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Oakridge Beverages sells $4,050 on credit on June 1, terms 2/15, n/45. On June 3 it gives a $280 allowance for a defect. The customer pays on June 18. Discounts are on the invoice net of returns and allowances.

How much cash does Oakridge Beverages receive?$q$, $q$["$3,770.00", "$3,969.00", "$3,694.60", "$4,050.00", "$3,689.00"]$q$::jsonb, 0, $q$Balance after the allowance = $3,770. Paid outside the 15-day window, so the discount is $0.00. Cash = $3,770.00.$q$),
  ($q$g-discount-07$q$, 1116, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Huron Hill Supply Ltd. sells $5,080 on credit on June 1, terms 3/15, n/45. On June 3 it gives a $160 allowance for a defect. The customer pays on June 29. Discounts are on the invoice net of returns and allowances.

How much cash does Huron Hill Supply Ltd. receive?$q$, $q$["$4,920.00", "$4,927.60", "$4,772.40", "$5,080.00", "$4,767.60"]$q$::jsonb, 0, $q$Balance after the allowance = $4,920. Paid outside the 15-day window, so the discount is $0.00. Cash = $4,920.00.$q$),
  ($q$g-discount-08$q$, 1117, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Northshore Goods Inc. sells $3,070 on credit on June 1, terms 4/15, n/45. On June 3 it gives a $140 allowance for a defect. The customer pays on June 15. Discounts are on the invoice net of returns and allowances.

How much cash does Northshore Goods Inc. receive?$q$, $q$["$2,812.80", "$2,947.20", "$2,930.00", "$3,070.00", "$2,807.20"]$q$::jsonb, 0, $q$Balance after the allowance = $2,930. Paid within the 15-day window, so the discount is $117.20. Cash = $2,812.80.$q$),
  ($q$g-discount-09$q$, 1118, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Cedar Lane Print Shop sells $5,120 on credit on June 1, terms 2/10, n/45. On June 3 it gives a $150 allowance for a defect. The customer pays on June 11. Discounts are on the invoice net of returns and allowances.

How much cash does Cedar Lane Print Shop receive?$q$, $q$["$4,870.60", "$5,017.60", "$4,970.00", "$5,120.00", "$4,867.60"]$q$::jsonb, 0, $q$Balance after the allowance = $4,970. Paid within the 10-day window, so the discount is $99.40. Cash = $4,870.60.$q$),
  ($q$g-discount-10$q$, 1119, $q$Foote's Print & Design$q$, $q$Sales discounts$q$, $q$Talbot Supply Ltd. sells $5,080 on credit on June 1, terms 5/15, n/45. On June 3 it gives a $250 allowance for a defect. The customer pays on June 30. Discounts are on the invoice net of returns and allowances.

How much cash does Talbot Supply Ltd. receive?$q$, $q$["$4,830.00", "$4,826.00", "$4,588.50", "$5,080.00", "$4,576.00"]$q$::jsonb, 0, $q$Balance after the allowance = $4,830. Paid outside the 15-day window, so the discount is $0.00. Cash = $4,830.00.$q$),
  ($q$g-recovery-01$q$, 1120, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $540 account was written off last year pays 50% as final settlement.

Which entries record this?$q$, $q$["DR A/R $270, CR AFDA $270; then DR Cash $270, CR A/R $270", "DR A/R $540, CR AFDA $540; then DR Cash $270, CR A/R $270", "DR Cash $270, CR Bad Debt Expense $270", "DR Cash $270, CR Revenue $270", "DR Cash $270, CR AFDA $270; then DR AFDA $270, CR A/R $270"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($270) — DR A/R, CR AFDA — then record the collection. Reinstating the full $540 leaves $270 in A/R that will never come in.$q$),
  ($q$g-recovery-02$q$, 1121, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $400 account was written off last year pays 30% as final settlement.

Which entries record this?$q$, $q$["DR A/R $120, CR AFDA $120; then DR Cash $120, CR A/R $120", "DR A/R $400, CR AFDA $400; then DR Cash $120, CR A/R $120", "DR Cash $120, CR Bad Debt Expense $120", "DR Cash $120, CR Revenue $120", "DR Cash $120, CR AFDA $120; then DR AFDA $280, CR A/R $280"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($120) — DR A/R, CR AFDA — then record the collection. Reinstating the full $400 leaves $280 in A/R that will never come in.$q$),
  ($q$g-recovery-03$q$, 1122, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $460 account was written off last year pays 40% as final settlement.

Which entries record this?$q$, $q$["DR A/R $184, CR AFDA $184; then DR Cash $184, CR A/R $184", "DR A/R $460, CR AFDA $460; then DR Cash $184, CR A/R $184", "DR Cash $184, CR Bad Debt Expense $184", "DR Cash $184, CR Revenue $184", "DR Cash $184, CR AFDA $184; then DR AFDA $276, CR A/R $276"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($184) — DR A/R, CR AFDA — then record the collection. Reinstating the full $460 leaves $276 in A/R that will never come in.$q$),
  ($q$g-recovery-04$q$, 1123, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $1,330 account was written off last year pays 30% as final settlement.

Which entries record this?$q$, $q$["DR A/R $399, CR AFDA $399; then DR Cash $399, CR A/R $399", "DR A/R $1,330, CR AFDA $1,330; then DR Cash $399, CR A/R $399", "DR Cash $399, CR Bad Debt Expense $399", "DR Cash $399, CR Revenue $399", "DR Cash $399, CR AFDA $399; then DR AFDA $931, CR A/R $931"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($399) — DR A/R, CR AFDA — then record the collection. Reinstating the full $1,330 leaves $931 in A/R that will never come in.$q$),
  ($q$g-recovery-05$q$, 1124, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $920 account was written off last year pays 50% as final settlement.

Which entries record this?$q$, $q$["DR A/R $460, CR AFDA $460; then DR Cash $460, CR A/R $460", "DR A/R $920, CR AFDA $920; then DR Cash $460, CR A/R $460", "DR Cash $460, CR Bad Debt Expense $460", "DR Cash $460, CR Revenue $460", "DR Cash $460, CR AFDA $460; then DR AFDA $460, CR A/R $460"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($460) — DR A/R, CR AFDA — then record the collection. Reinstating the full $920 leaves $460 in A/R that will never come in.$q$),
  ($q$g-recovery-06$q$, 1125, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $1,830 account was written off last year pays 50% as final settlement.

Which entries record this?$q$, $q$["DR A/R $915, CR AFDA $915; then DR Cash $915, CR A/R $915", "DR A/R $1,830, CR AFDA $1,830; then DR Cash $915, CR A/R $915", "DR Cash $915, CR Bad Debt Expense $915", "DR Cash $915, CR Revenue $915", "DR Cash $915, CR AFDA $915; then DR AFDA $915, CR A/R $915"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($915) — DR A/R, CR AFDA — then record the collection. Reinstating the full $1,830 leaves $915 in A/R that will never come in.$q$),
  ($q$g-recovery-07$q$, 1126, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $1,630 account was written off last year pays 25% as final settlement.

Which entries record this?$q$, $q$["DR A/R $408, CR AFDA $408; then DR Cash $408, CR A/R $408", "DR A/R $1,630, CR AFDA $1,630; then DR Cash $408, CR A/R $408", "DR Cash $408, CR Bad Debt Expense $408", "DR Cash $408, CR Revenue $408", "DR Cash $408, CR AFDA $408; then DR AFDA $1,223, CR A/R $1,223"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($408) — DR A/R, CR AFDA — then record the collection. Reinstating the full $1,630 leaves $1,223 in A/R that will never come in.$q$),
  ($q$g-recovery-08$q$, 1127, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $820 account was written off last year pays 25% as final settlement.

Which entries record this?$q$, $q$["DR A/R $205, CR AFDA $205; then DR Cash $205, CR A/R $205", "DR A/R $820, CR AFDA $820; then DR Cash $205, CR A/R $205", "DR Cash $205, CR Bad Debt Expense $205", "DR Cash $205, CR Revenue $205", "DR Cash $205, CR AFDA $205; then DR AFDA $615, CR A/R $615"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($205) — DR A/R, CR AFDA — then record the collection. Reinstating the full $820 leaves $615 in A/R that will never come in.$q$),
  ($q$g-recovery-09$q$, 1128, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $1,880 account was written off last year pays 60% as final settlement.

Which entries record this?$q$, $q$["DR A/R $1,128, CR AFDA $1,128; then DR Cash $1,128, CR A/R $1,128", "DR A/R $1,880, CR AFDA $1,880; then DR Cash $1,128, CR A/R $1,128", "DR Cash $1,128, CR Bad Debt Expense $1,128", "DR Cash $1,128, CR Revenue $1,128", "DR Cash $1,128, CR AFDA $1,128; then DR AFDA $752, CR A/R $752"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($1,128) — DR A/R, CR AFDA — then record the collection. Reinstating the full $1,880 leaves $752 in A/R that will never come in.$q$),
  ($q$g-recovery-10$q$, 1129, $q$Foote's Print & Design$q$, $q$Write-offs and recoveries$q$, $q$A customer whose $1,190 account was written off last year pays 30% as final settlement.

Which entries record this?$q$, $q$["DR A/R $357, CR AFDA $357; then DR Cash $357, CR A/R $357", "DR A/R $1,190, CR AFDA $1,190; then DR Cash $357, CR A/R $357", "DR Cash $357, CR Bad Debt Expense $357", "DR Cash $357, CR Revenue $357", "DR Cash $357, CR AFDA $357; then DR AFDA $833, CR A/R $833"]$q$::jsonb, 0, $q$Reinstate only what's being paid ($357) — DR A/R, CR AFDA — then record the collection. Reinstating the full $1,190 leaves $833 in A/R that will never come in.$q$),
  ($q$g-netcost-01$q$, 1130, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Springbank Goods Inc. orders goods at an invoice price of $3,980, shipped June 2 FOB destination and arriving June 5. Freight of $286 is charged by the carrier. Terms are 5/15, n/30 from the date of ownership. $60 of goods are returned for credit. The account is paid on June 23. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$3,920", "$3,724", "$4,206", "$3,970", "$3,721"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 5, so the discount window runs to June 20. Paid June 23 — too late, no discount. Freight is the seller’s. Net cost = $3,920.00.$q$),
  ($q$g-netcost-02$q$, 1131, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Byron Imports orders goods at an invoice price of $1,100, shipped June 3 FOB destination and arriving June 6. Freight of $40 is charged by the carrier. Terms are 5/10, n/30 from the date of ownership. $124 of goods are returned for credit. The account is paid on June 19. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$976", "$927", "$1,016", "$1,026", "$921"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 6, so the discount window runs to June 16. Paid June 19 — too late, no discount. Freight is the seller’s. Net cost = $976.00.$q$),
  ($q$g-netcost-03$q$, 1132, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Masonville Outfitters orders goods at an invoice price of $3,760, shipped June 7 FOB destination and arriving June 11. Freight of $248 is charged by the carrier. Terms are 4/10, n/30 from the date of ownership. $96 of goods are returned for credit. The account is paid on June 22. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$3,664", "$3,517", "$3,912", "$3,714", "$3,514"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 11, so the discount window runs to June 21. Paid June 22 — too late, no discount. Freight is the seller’s. Net cost = $3,664.00.$q$),
  ($q$g-netcost-04$q$, 1133, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Springbank Goods Inc. orders goods at an invoice price of $4,660, shipped June 4 FOB destination and arriving June 6. Freight of $80 is charged by the carrier. Terms are 4/10, n/30 from the date of ownership. $336 of goods are returned for credit. The account is paid on June 19. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$4,324", "$4,151", "$4,404", "$4,374", "$4,138"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 6, so the discount window runs to June 16. Paid June 19 — too late, no discount. Freight is the seller’s. Net cost = $4,324.00.$q$),
  ($q$g-netcost-05$q$, 1134, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Lakehead Stationers orders goods at an invoice price of $1,240, shipped June 6 FOB destination and arriving June 10. Freight of $104 is charged by the carrier. Terms are 4/10, n/30 from the date of ownership. $280 of goods are returned for credit. The account is paid on June 18. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$922", "$960", "$1,026", "$910", "$857"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 10, so the discount window runs to June 20. Paid June 18 — inside, discount $38.40. Freight is the seller’s. Net cost = $921.60.$q$),
  ($q$g-netcost-06$q$, 1135, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Lakehead Imports orders goods at an invoice price of $3,540, shipped June 2 FOB shipping point and arriving June 6. Freight of $118 is charged by the carrier. Terms are 3/15, n/30 from the date of ownership. $342 of goods are returned for credit. The account is paid on June 20. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$3,316", "$3,220", "$3,198", "$3,366", "$3,210"]$q$::jsonb, 0, $q$FOB shipping point: ownership passes June 2, so the discount window runs to June 17. Paid June 20 — too late, no discount. Freight is the buyer’s and part of inventory. Net cost = $3,316.00.$q$),
  ($q$g-netcost-07$q$, 1136, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Kingsway Goods Inc. orders goods at an invoice price of $2,670, shipped June 3 FOB shipping point and arriving June 7. Freight of $186 is charged by the carrier. Terms are 4/10, n/30 from the date of ownership. $130 of goods are returned for credit. The account is paid on June 14. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$2,726", "$2,624", "$2,540", "$2,776", "$2,619"]$q$::jsonb, 0, $q$FOB shipping point: ownership passes June 3, so the discount window runs to June 13. Paid June 14 — too late, no discount. Freight is the buyer’s and part of inventory. Net cost = $2,726.00.$q$),
  ($q$g-netcost-08$q$, 1137, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Byron Sports Ltd. orders goods at an invoice price of $4,630, shipped June 8 FOB destination and arriving June 13. Freight of $62 is charged by the carrier. Terms are 3/10, n/30 from the date of ownership. $96 of goods are returned for credit. The account is paid on June 21. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$4,398", "$4,534", "$4,460", "$4,395", "$4,090"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 13, so the discount window runs to June 23. Paid June 21 — inside, discount $136.02. Freight is the seller’s. Net cost = $4,397.98.$q$),
  ($q$g-netcost-09$q$, 1138, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Kingsway Imports orders goods at an invoice price of $1,430, shipped June 4 FOB destination and arriving June 9. Freight of $194 is charged by the carrier. Terms are 3/8, n/30 from the date of ownership. $240 of goods are returned for credit. The account is paid on June 18. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$1,190", "$1,154", "$1,384", "$1,240", "$1,147"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 9, so the discount window runs to June 17. Paid June 18 — too late, no discount. Freight is the seller’s. Net cost = $1,190.00.$q$),
  ($q$g-netcost-10$q$, 1139, $q$Lakeshore Tea$q$, $q$Purchases$q$, $q$Cedar Lane Outfitters orders goods at an invoice price of $1,950, shipped June 7 FOB destination and arriving June 9. Freight of $110 is charged by the carrier. Terms are 3/8, n/30 from the date of ownership. $294 of goods are returned for credit. The account is paid on June 17. Discounts are on the invoice price net of returns.

What net cost is added to Inventory?$q$, $q$["$1,606", "$1,656", "$1,716", "$1,598", "$1,494"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 9, so the discount window runs to June 17. Paid June 17 — inside, discount $49.68. Freight is the seller’s. Net cost = $1,606.32.$q$),
  ($q$g-eom-01$q$, 1140, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed May 23 with terms 10 EOM, FOB shipping point. Goods ship May 26 and arrive June 6. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded May 26; due June 10", "Recorded June 6; due July 10", "Recorded May 26; due June 5", "Recorded May 23; due June 10", "Recorded May 26; due July 10"]$q$::jsonb, 0, $q$FOB shipping point: ownership passes May 26, so record the purchase then. 10 EOM = 10 days after the end of the month of ownership: June 10.$q$),
  ($q$g-eom-02$q$, 1141, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed April 18 with terms 15 EOM, FOB destination. Goods ship April 21 and arrive May 3. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded May 3; due June 15", "Recorded April 21; due May 15", "Recorded May 3; due May 18", "Recorded April 18; due June 15", "Recorded May 3; due May 15"]$q$::jsonb, 0, $q$FOB destination: ownership passes May 3, so record the purchase then. 15 EOM = 15 days after the end of the month of ownership: June 15.$q$),
  ($q$g-eom-03$q$, 1142, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed May 17 with terms 10 EOM, FOB destination. Goods ship May 20 and arrive May 29. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded May 29; due June 10", "Recorded May 20; due June 10", "Recorded May 29; due June 8", "Recorded May 17; due June 10", "Recorded May 29; due July 10"]$q$::jsonb, 0, $q$FOB destination: ownership passes May 29, so record the purchase then. 10 EOM = 10 days after the end of the month of ownership: June 10.$q$),
  ($q$g-eom-04$q$, 1143, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed May 22 with terms 15 EOM, FOB shipping point. Goods ship May 25 and arrive May 31. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded May 25; due June 15", "Recorded May 31; due June 15", "Recorded May 25; due June 9", "Recorded May 22; due June 15", "Recorded May 25; due July 15"]$q$::jsonb, 0, $q$FOB shipping point: ownership passes May 25, so record the purchase then. 15 EOM = 15 days after the end of the month of ownership: June 15.$q$),
  ($q$g-eom-05$q$, 1144, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed April 22 with terms 15 EOM, FOB shipping point. Goods ship April 25 and arrive April 30. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded April 25; due May 15", "Recorded April 30; due May 15", "Recorded April 25; due May 10", "Recorded April 22; due May 15", "Recorded April 25; due June 14"]$q$::jsonb, 0, $q$FOB shipping point: ownership passes April 25, so record the purchase then. 15 EOM = 15 days after the end of the month of ownership: May 15.$q$),
  ($q$g-eom-06$q$, 1145, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed May 22 with terms 10 EOM, FOB destination. Goods ship May 25 and arrive June 5. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded June 5; due July 10", "Recorded May 25; due June 10", "Recorded June 5; due June 15", "Recorded May 22; due July 10", "Recorded June 5; due June 10"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 5, so record the purchase then. 10 EOM = 10 days after the end of the month of ownership: July 10.$q$),
  ($q$g-eom-07$q$, 1146, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed April 24 with terms 15 EOM, FOB destination. Goods ship April 27 and arrive May 6. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded May 6; due June 15", "Recorded April 27; due May 15", "Recorded May 6; due May 21", "Recorded April 24; due June 15", "Recorded May 6; due May 15"]$q$::jsonb, 0, $q$FOB destination: ownership passes May 6, so record the purchase then. 15 EOM = 15 days after the end of the month of ownership: June 15.$q$),
  ($q$g-eom-08$q$, 1147, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed April 19 with terms 15 EOM, FOB destination. Goods ship April 22 and arrive April 28. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded April 28; due May 15", "Recorded April 22; due May 15", "Recorded April 28; due May 13", "Recorded April 19; due May 15", "Recorded April 28; due June 14"]$q$::jsonb, 0, $q$FOB destination: ownership passes April 28, so record the purchase then. 15 EOM = 15 days after the end of the month of ownership: May 15.$q$),
  ($q$g-eom-09$q$, 1148, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed May 23 with terms 10 EOM, FOB destination. Goods ship May 26 and arrive June 4. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded June 4; due July 10", "Recorded May 26; due June 10", "Recorded June 4; due June 14", "Recorded May 23; due July 10", "Recorded June 4; due June 10"]$q$::jsonb, 0, $q$FOB destination: ownership passes June 4, so record the purchase then. 10 EOM = 10 days after the end of the month of ownership: July 10.$q$),
  ($q$g-eom-10$q$, 1149, $q$Lakeshore Tea$q$, $q$Ownership and credit terms$q$, $q$An order is placed March 25 with terms 15 EOM, FOB destination. Goods ship March 28 and arrive April 9. Credit terms run from the date of ownership.

When is the purchase recorded, and when is payment due?$q$, $q$["Recorded April 9; due May 15", "Recorded March 28; due April 15", "Recorded April 9; due April 24", "Recorded March 25; due May 15", "Recorded April 9; due April 15"]$q$::jsonb, 0, $q$FOB destination: ownership passes April 9, so record the purchase then. 15 EOM = 15 days after the end of the month of ownership: May 15.$q$),
  ($q$g-cogs-01$q$, 1150, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Cedar Lane Outfitters uses a periodic system. For the month:
• Opening inventory $6,943
• Purchases $8,091
• Freight-in $106
• Purchase returns $429
• Purchase discounts $281
• Freight-out on sales $108
• Ending count $4,100

One sale's note says its cost was $886. What is cost of goods sold?$q$, $q$["$10,330", "$10,224", "$11,040", "$10,934", "$886"]$q$::jsonb, 0, $q$Available = $6,943 + $8,091 + $106 − $429 − $281; COGS = available − $4,100 = $10,330. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-02$q$, 1151, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Cedar Lane Goods Inc. uses a periodic system. For the month:
• Opening inventory $7,840
• Purchases $4,972
• Freight-in $283
• Purchase returns $175
• Purchase discounts $267
• Freight-out on sales $134
• Ending count $8,862

One sale's note says its cost was $485. What is cost of goods sold?$q$, $q$["$3,791", "$3,508", "$4,233", "$3,950", "$485"]$q$::jsonb, 0, $q$Available = $7,840 + $4,972 + $283 − $175 − $267; COGS = available − $8,862 = $3,791. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-03$q$, 1152, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Oakridge Supply Ltd. uses a periodic system. For the month:
• Opening inventory $7,021
• Purchases $4,254
• Freight-in $75
• Purchase returns $280
• Purchase discounts $276
• Freight-out on sales $76
• Ending count $3,254

One sale's note says its cost was $493. What is cost of goods sold?$q$, $q$["$7,540", "$7,465", "$8,096", "$8,021", "$493"]$q$::jsonb, 0, $q$Available = $7,021 + $4,254 + $75 − $280 − $276; COGS = available − $3,254 = $7,540. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-04$q$, 1153, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Westmount Sports Ltd. uses a periodic system. For the month:
• Opening inventory $8,488
• Purchases $6,874
• Freight-in $235
• Purchase returns $410
• Purchase discounts $227
• Freight-out on sales $250
• Ending count $4,172

One sale's note says its cost was $809. What is cost of goods sold?$q$, $q$["$10,788", "$10,553", "$11,425", "$11,190", "$809"]$q$::jsonb, 0, $q$Available = $8,488 + $6,874 + $235 − $410 − $227; COGS = available − $4,172 = $10,788. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-05$q$, 1154, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Glenview Beverages uses a periodic system. For the month:
• Opening inventory $3,668
• Purchases $11,065
• Freight-in $349
• Purchase returns $150
• Purchase discounts $299
• Freight-out on sales $237
• Ending count $7,763

One sale's note says its cost was $260. What is cost of goods sold?$q$, $q$["$6,870", "$6,521", "$7,319", "$6,970", "$260"]$q$::jsonb, 0, $q$Available = $3,668 + $11,065 + $349 − $150 − $299; COGS = available − $7,763 = $6,870. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-06$q$, 1155, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Maple Ridge Print Shop uses a periodic system. For the month:
• Opening inventory $8,569
• Purchases $9,042
• Freight-in $269
• Purchase returns $399
• Purchase discounts $187
• Freight-out on sales $105
• Ending count $4,340

One sale's note says its cost was $202. What is cost of goods sold?$q$, $q$["$12,954", "$12,685", "$13,540", "$13,271", "$202"]$q$::jsonb, 0, $q$Available = $8,569 + $9,042 + $269 − $399 − $187; COGS = available − $4,340 = $12,954. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-07$q$, 1156, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Birchwood Apparel uses a periodic system. For the month:
• Opening inventory $8,793
• Purchases $6,220
• Freight-in $278
• Purchase returns $402
• Purchase discounts $230
• Freight-out on sales $151
• Ending count $8,816

One sale's note says its cost was $456. What is cost of goods sold?$q$, $q$["$5,843", "$5,565", "$6,475", "$6,197", "$456"]$q$::jsonb, 0, $q$Available = $8,793 + $6,220 + $278 − $402 − $230; COGS = available − $8,816 = $5,843. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-08$q$, 1157, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Northshore Sports Ltd. uses a periodic system. For the month:
• Opening inventory $8,974
• Purchases $6,882
• Freight-in $260
• Purchase returns $161
• Purchase discounts $64
• Freight-out on sales $250
• Ending count $4,735

One sale's note says its cost was $595. What is cost of goods sold?$q$, $q$["$11,156", "$10,896", "$11,381", "$11,121", "$595"]$q$::jsonb, 0, $q$Available = $8,974 + $6,882 + $260 − $161 − $64; COGS = available − $4,735 = $11,156. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-09$q$, 1158, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Elgin Imports uses a periodic system. For the month:
• Opening inventory $5,548
• Purchases $9,408
• Freight-in $165
• Purchase returns $261
• Purchase discounts $383
• Freight-out on sales $279
• Ending count $8,126

One sale's note says its cost was $607. What is cost of goods sold?$q$, $q$["$6,351", "$6,186", "$6,995", "$6,830", "$607"]$q$::jsonb, 0, $q$Available = $5,548 + $9,408 + $165 − $261 − $383; COGS = available − $8,126 = $6,351. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-cogs-10$q$, 1159, $q$Lakeshore Tea$q$, $q$Inventory and COGS$q$, $q$Byron Goods Inc. uses a periodic system. For the month:
• Opening inventory $4,951
• Purchases $4,627
• Freight-in $63
• Purchase returns $430
• Purchase discounts $300
• Freight-out on sales $191
• Ending count $3,102

One sale's note says its cost was $532. What is cost of goods sold?$q$, $q$["$5,809", "$5,746", "$6,539", "$6,476", "$532"]$q$::jsonb, 0, $q$Available = $4,951 + $4,627 + $63 − $430 − $300; COGS = available − $3,102 = $5,809. Freight-out is a selling expense; per-sale costs aren't recorded in a periodic system.$q$),
  ($q$g-gp-01$q$, 1160, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Kingsway Outfitters's month: credit sales $9,448, cash sales $3,851, sales returns and allowances $397, sales discounts $76, freight-out $82, cost of goods sold $7,072.

What is gross profit?$q$, $q$["$5,754", "$6,227", "$5,672", "$12,826", "$1,903"]$q$::jsonb, 0, $q$Net sales = $13,299 − $397 − $76 = $12,826. Gross profit = net sales − COGS = $5,754. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-02$q$, 1161, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Prairie Rose Goods Inc.'s month: credit sales $12,888, cash sales $1,843, sales returns and allowances $547, sales discounts $134, freight-out $198, cost of goods sold $7,619.

What is gross profit?$q$, $q$["$6,431", "$7,112", "$6,233", "$14,050", "$4,588"]$q$::jsonb, 0, $q$Net sales = $14,731 − $547 − $134 = $14,050. Gross profit = net sales − COGS = $6,431. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-03$q$, 1162, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Oakridge Sports Ltd.'s month: credit sales $10,670, cash sales $3,532, sales returns and allowances $108, sales discounts $126, freight-out $202, cost of goods sold $7,813.

What is gross profit?$q$, $q$["$6,155", "$6,389", "$5,953", "$13,968", "$2,623"]$q$::jsonb, 0, $q$Net sales = $14,202 − $108 − $126 = $13,968. Gross profit = net sales − COGS = $6,155. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-04$q$, 1163, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Cedar Lane Apparel's month: credit sales $10,189, cash sales $3,705, sales returns and allowances $158, sales discounts $96, freight-out $158, cost of goods sold $6,314.

What is gross profit?$q$, $q$["$7,326", "$7,580", "$7,168", "$13,640", "$3,621"]$q$::jsonb, 0, $q$Net sales = $13,894 − $158 − $96 = $13,640. Gross profit = net sales − COGS = $7,326. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-05$q$, 1164, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Wortley Outfitters's month: credit sales $7,192, cash sales $971, sales returns and allowances $780, sales discounts $245, freight-out $62, cost of goods sold $4,750.

What is gross profit?$q$, $q$["$2,388", "$3,413", "$2,326", "$7,138", "$1,417"]$q$::jsonb, 0, $q$Net sales = $8,163 − $780 − $245 = $7,138. Gross profit = net sales − COGS = $2,388. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-06$q$, 1165, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Fanshawe Apparel's month: credit sales $10,556, cash sales $3,238, sales returns and allowances $647, sales discounts $350, freight-out $245, cost of goods sold $7,425.

What is gross profit?$q$, $q$["$5,372", "$6,369", "$5,127", "$12,797", "$2,134"]$q$::jsonb, 0, $q$Net sales = $13,794 − $647 − $350 = $12,797. Gross profit = net sales − COGS = $5,372. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-07$q$, 1166, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Elgin Beverages's month: credit sales $11,221, cash sales $958, sales returns and allowances $799, sales discounts $53, freight-out $118, cost of goods sold $5,604.

What is gross profit?$q$, $q$["$5,723", "$6,575", "$5,605", "$11,327", "$4,765"]$q$::jsonb, 0, $q$Net sales = $12,179 − $799 − $53 = $11,327. Gross profit = net sales − COGS = $5,723. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-08$q$, 1167, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Fanshawe Print Shop's month: credit sales $11,299, cash sales $2,942, sales returns and allowances $780, sales discounts $106, freight-out $203, cost of goods sold $7,813.

What is gross profit?$q$, $q$["$5,542", "$6,428", "$5,339", "$13,355", "$2,600"]$q$::jsonb, 0, $q$Net sales = $14,241 − $780 − $106 = $13,355. Gross profit = net sales − COGS = $5,542. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-09$q$, 1168, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Wortley Imports's month: credit sales $13,247, cash sales $1,608, sales returns and allowances $118, sales discounts $345, freight-out $112, cost of goods sold $7,035.

What is gross profit?$q$, $q$["$7,357", "$7,820", "$7,245", "$14,392", "$5,749"]$q$::jsonb, 0, $q$Net sales = $14,855 − $118 − $345 = $14,392. Gross profit = net sales − COGS = $7,357. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-gp-10$q$, 1169, $q$Lakeshore Tea$q$, $q$Revenue section$q$, $q$Oakridge Stationers's month: credit sales $10,762, cash sales $1,947, sales returns and allowances $246, sales discounts $329, freight-out $145, cost of goods sold $5,879.

What is gross profit?$q$, $q$["$6,255", "$6,830", "$6,110", "$12,134", "$4,308"]$q$::jsonb, 0, $q$Net sales = $12,709 − $246 − $329 = $12,134. Gross profit = net sales − COGS = $6,255. Freight-out is an operating expense, below gross profit.$q$),
  ($q$g-ordercost-01$q$, 1170, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$2,000 bottles at $3.20 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. Payment is made 18 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$7,120; $3.560 per bottle", "$6,400; $3.200 per bottle", "$6,800; $3.400 per bottle", "$6,622; $3.311 per bottle", "$8,117; $4.058 per bottle"]$q$::jsonb, 0, $q$Net invoice $6,400.00; duty $0.00; freight $720.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 15 days of ownership). Total $7,120.00; ÷ 2,000 bottles = $3.560.$q$),
  ($q$g-ordercost-02$q$, 1171, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,700 bottles at $3.00 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 4 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$6,079; $3.576 per bottle", "$5,279; $3.105 per bottle", "$6,232; $3.666 per bottle", "$5,653; $3.325 per bottle", "$6,929; $4.076 per bottle"]$q$::jsonb, 0, $q$Net invoice $5,100.00; duty $331.50; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $153.00 (paid within 10 days of ownership). Total $6,078.50; ÷ 1,700 bottles = $3.576.$q$),
  ($q$g-ordercost-03$q$, 1172, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$3,000 bottles at $3.20 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. Payment is made 7 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$10,200; $3.400 per bottle", "$9,120; $3.040 per bottle", "$10,680; $3.560 per bottle", "$9,486; $3.162 per bottle", "$11,628; $3.876 per bottle"]$q$::jsonb, 0, $q$Net invoice $9,600.00; duty $0.00; freight $1,080.00 (FOB the supplier's city, so the buyer pays); discount $480.00 (paid within 15 days of ownership). Total $10,200.00; ÷ 3,000 bottles = $3.400.$q$),
  ($q$g-ordercost-04$q$, 1173, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$2,300 bottles at $3.40 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 13 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$9,128; $3.969 per bottle", "$8,328; $3.621 per bottle", "$8,894; $3.867 per bottle", "$8,489; $3.691 per bottle", "$10,406; $4.524 per bottle"]$q$::jsonb, 0, $q$Net invoice $7,820.00; duty $508.30; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $9,128.30; ÷ 2,300 bottles = $3.969.$q$),
  ($q$g-ordercost-05$q$, 1174, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,500 bottles at $2.85 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 13 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$5,353; $3.569 per bottle", "$4,553; $3.035 per bottle", "$5,225; $3.483 per bottle", "$4,978; $3.319 per bottle", "$6,102; $4.068 per bottle"]$q$::jsonb, 0, $q$Net invoice $4,275.00; duty $277.88; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $5,352.88; ÷ 1,500 bottles = $3.569.$q$),
  ($q$g-ordercost-06$q$, 1175, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,400 bottles at $3.00 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 13 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$5,273; $3.766 per bottle", "$4,473; $3.195 per bottle", "$5,147; $3.676 per bottle", "$4,904; $3.503 per bottle", "$6,011; $4.294 per bottle"]$q$::jsonb, 0, $q$Net invoice $4,200.00; duty $273.00; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $5,273.00; ÷ 1,400 bottles = $3.766.$q$),
  ($q$g-ordercost-07$q$, 1176, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$4,600 bottles at $3.00 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 4 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$15,083; $3.279 per bottle", "$14,283; $3.105 per bottle", "$15,497; $3.369 per bottle", "$14,027; $3.049 per bottle", "$17,195; $3.738 per bottle"]$q$::jsonb, 0, $q$Net invoice $13,800.00; duty $897.00; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $414.00 (paid within 10 days of ownership). Total $15,083.00; ÷ 4,600 bottles = $3.279.$q$),
  ($q$g-ordercost-08$q$, 1177, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$2,300 bottles at $3.00 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 19 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$8,149; $3.543 per bottle", "$7,349; $3.195 per bottle", "$7,942; $3.453 per bottle", "$7,578; $3.295 per bottle", "$9,289; $4.039 per bottle"]$q$::jsonb, 0, $q$Net invoice $6,900.00; duty $448.50; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $8,148.50; ÷ 2,300 bottles = $3.543.$q$),
  ($q$g-ordercost-09$q$, 1178, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,600 bottles at $3.20 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. Payment is made 4 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$5,440; $3.400 per bottle", "$4,864; $3.040 per bottle", "$5,696; $3.560 per bottle", "$5,059; $3.162 per bottle", "$6,202; $3.876 per bottle"]$q$::jsonb, 0, $q$Net invoice $5,120.00; duty $0.00; freight $576.00 (FOB the supplier's city, so the buyer pays); discount $256.00 (paid within 15 days of ownership). Total $5,440.00; ÷ 1,600 bottles = $3.400.$q$),
  ($q$g-ordercost-10$q$, 1179, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$4,900 bottles at $2.85 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. 200 bottles are returned; the supplier pays the return shipping but does not refund duty. Payment is made 7 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$14,701; $3.128 per bottle", "$14,684; $3.124 per bottle", "$13,901; $2.958 per bottle", "$15,103; $3.213 per bottle", "$15,254; $3.113 per bottle"]$q$::jsonb, 0, $q$Net invoice $13,395.00; duty $907.73; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $401.85 (paid within 10 days of ownership). Total $14,700.88; ÷ 4,700 bottles = $3.128.$q$),
  ($q$g-ordercost-11$q$, 1180, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$4,600 bottles at $2.85 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 19 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$14,762; $3.209 per bottle", "$13,962; $3.035 per bottle", "$14,369; $3.124 per bottle", "$13,729; $2.985 per bottle", "$16,829; $3.658 per bottle"]$q$::jsonb, 0, $q$Net invoice $13,110.00; duty $852.15; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $14,762.15; ÷ 4,600 bottles = $3.209.$q$),
  ($q$g-ordercost-12$q$, 1181, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,900 bottles at $3.00 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 4 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$6,700; $3.526 per bottle", "$5,900; $3.105 per bottle", "$6,871; $3.616 per bottle", "$6,231; $3.279 per bottle", "$7,637; $4.020 per bottle"]$q$::jsonb, 0, $q$Net invoice $5,700.00; duty $370.50; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $171.00 (paid within 10 days of ownership). Total $6,699.50; ÷ 1,900 bottles = $3.526.$q$),
  ($q$g-ordercost-13$q$, 1182, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$5,100 bottles at $3.10 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 19 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$17,638; $3.458 per bottle", "$16,838; $3.302 per bottle", "$17,163; $3.365 per bottle", "$16,403; $3.216 per bottle", "$20,107; $3.943 per bottle"]$q$::jsonb, 0, $q$Net invoice $15,810.00; duty $1,027.65; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $17,637.65; ÷ 5,100 bottles = $3.458.$q$),
  ($q$g-ordercost-14$q$, 1183, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,600 bottles at $2.85 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. 250 bottles are returned; the supplier pays the return shipping but does not refund duty. Payment is made 7 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$4,141; $3.067 per bottle", "$4,106; $3.041 per bottle", "$3,655; $2.708 per bottle", "$4,334; $3.210 per bottle", "$4,908; $3.067 per bottle"]$q$::jsonb, 0, $q$Net invoice $3,847.50; duty $0.00; freight $486.00 (FOB the supplier's city, so the buyer pays); discount $192.38 (paid within 15 days of ownership). Total $4,141.13; ÷ 1,350 bottles = $3.067.$q$),
  ($q$g-ordercost-15$q$, 1184, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$2,100 bottles at $3.20 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. Payment is made 4 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$7,140; $3.400 per bottle", "$6,384; $3.040 per bottle", "$7,476; $3.560 per bottle", "$6,640; $3.162 per bottle", "$8,140; $3.876 per bottle"]$q$::jsonb, 0, $q$Net invoice $6,720.00; duty $0.00; freight $756.00 (FOB the supplier's city, so the buyer pays); discount $336.00 (paid within 15 days of ownership). Total $7,140.00; ÷ 2,100 bottles = $3.400.$q$),
  ($q$g-ordercost-16$q$, 1185, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$5,700 bottles at $3.20 are bought from Tapped (Seattle), shipped FOB Seattle, terms 3/10, n/30. The buyer's carrier charges a flat $800 per US order. Import duty is 6.5% of the invoice price. Payment is made 13 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$20,226; $3.548 per bottle", "$19,426; $3.408 per bottle", "$19,678; $3.452 per bottle", "$18,810; $3.300 per bottle", "$23,057; $4.045 per bottle"]$q$::jsonb, 0, $q$Net invoice $18,240.00; duty $1,185.60; freight $800.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 10 days of ownership). Total $20,225.60; ÷ 5,700 bottles = $3.548.$q$),
  ($q$g-ordercost-17$q$, 1186, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$3,700 bottles at $2.85 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. Payment is made 24 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$11,877; $3.210 per bottle", "$10,545; $2.850 per bottle", "$11,350; $3.067 per bottle", "$11,046; $2.985 per bottle", "$13,540; $3.659 per bottle"]$q$::jsonb, 0, $q$Net invoice $10,545.00; duty $0.00; freight $1,332.00 (FOB the supplier's city, so the buyer pays); discount $0.00 (paid after 15 days of ownership). Total $11,877.00; ÷ 3,700 bottles = $3.210.$q$),
  ($q$g-ordercost-18$q$, 1187, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$2,100 bottles at $2.85 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. Payment is made 15 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$6,442; $3.067 per bottle", "$5,686; $2.708 per bottle", "$6,741; $3.210 per bottle", "$5,991; $2.853 per bottle", "$7,344; $3.497 per bottle"]$q$::jsonb, 0, $q$Net invoice $5,985.00; duty $0.00; freight $756.00 (FOB the supplier's city, so the buyer pays); discount $299.25 (paid within 15 days of ownership). Total $6,441.75; ÷ 2,100 bottles = $3.067.$q$),
  ($q$g-ordercost-19$q$, 1188, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$4,100 bottles at $2.85 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. 100 bottles are returned; the supplier pays the return shipping and refunds the duty on them. Payment is made 4 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$12,270; $3.067 per bottle", "$12,256; $3.064 per bottle", "$10,830; $2.708 per bottle", "$12,840; $3.210 per bottle", "$12,577; $3.067 per bottle"]$q$::jsonb, 0, $q$Net invoice $11,400.00; duty $0.00; freight $1,440.00 (FOB the supplier's city, so the buyer pays); discount $570.00 (paid within 15 days of ownership). Total $12,270.00; ÷ 4,000 bottles = $3.067.$q$),
  ($q$g-ordercost-20$q$, 1189, $q$Kombucha Canada$q$, $q$Cost of a purchase$q$, $q$1,300 bottles at $3.10 are bought from Western (Calgary), shipped FOB Calgary, terms 5/15, n/30. The buyer's carrier charges $0.36 per bottle received. No duty applies to a Canadian supplier. 200 bottles are returned; the supplier pays the return shipping but does not refund duty. Payment is made 7 days after shipping. Discounts are on the invoice price net of returns.

What is the total net cost, and the cost per bottle kept?$q$, $q$["$3,636; $3.305 per bottle", "$3,605; $3.277 per bottle", "$3,240; $2.945 per bottle", "$3,806; $3.460 per bottle", "$4,297; $3.305 per bottle"]$q$::jsonb, 0, $q$Net invoice $3,410.00; duty $0.00; freight $396.00 (FOB the supplier's city, so the buyer pays); discount $170.50 (paid within 15 days of ownership). Total $3,635.50; ÷ 1,100 bottles = $3.305.$q$),
  ($q$g-transit-01$q$, 1190, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 4,450 bottles. Also:
• 2,100 bottles shipped two days before year end, FOB shipping point, still in transit
• 1,600 bottles shipped the day before year end, FOB destination, still in transit
• 850 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["5,700", "6,550", "4,450", "7,300", "3,600"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 4,450 − 850 + the shipping-point shipment = 5,700.$q$),
  ($q$g-transit-02$q$, 1191, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 7,250 bottles. Also:
• 2,300 bottles shipped two days before year end, FOB shipping point, still in transit
• 2,200 bottles shipped the day before year end, FOB destination, still in transit
• 570 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["8,980", "9,550", "7,250", "11,180", "6,680"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 7,250 − 570 + the shipping-point shipment = 8,980.$q$),
  ($q$g-transit-03$q$, 1192, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 4,300 bottles. Also:
• 1,800 bottles shipped two days before year end, FOB destination, still in transit
• 1,100 bottles shipped the day before year end, FOB shipping point, still in transit
• 620 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["4,780", "5,400", "4,300", "6,580", "3,680"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 4,300 − 620 + the shipping-point shipment = 4,780.$q$),
  ($q$g-transit-04$q$, 1193, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 5,000 bottles. Also:
• 1,000 bottles shipped two days before year end, FOB destination, still in transit
• 1,700 bottles shipped the day before year end, FOB shipping point, still in transit
• 550 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["6,150", "6,700", "5,000", "7,150", "4,450"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 5,000 − 550 + the shipping-point shipment = 6,150.$q$),
  ($q$g-transit-05$q$, 1194, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 7,600 bottles. Also:
• 3,400 bottles shipped two days before year end, FOB shipping point, still in transit
• 3,100 bottles shipped the day before year end, FOB destination, still in transit
• 550 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["10,450", "11,000", "7,600", "13,550", "7,050"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 7,600 − 550 + the shipping-point shipment = 10,450.$q$),
  ($q$g-transit-06$q$, 1195, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 6,950 bottles. Also:
• 2,000 bottles shipped two days before year end, FOB destination, still in transit
• 3,800 bottles shipped the day before year end, FOB shipping point, still in transit
• 530 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["10,220", "10,750", "6,950", "12,220", "6,420"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 6,950 − 530 + the shipping-point shipment = 10,220.$q$),
  ($q$g-transit-07$q$, 1196, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 8,050 bottles. Also:
• 3,800 bottles shipped two days before year end, FOB destination, still in transit
• 1,300 bottles shipped the day before year end, FOB shipping point, still in transit
• 270 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["9,080", "9,350", "8,050", "12,880", "7,780"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 8,050 − 270 + the shipping-point shipment = 9,080.$q$),
  ($q$g-transit-08$q$, 1197, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 3,300 bottles. Also:
• 3,500 bottles shipped two days before year end, FOB shipping point, still in transit
• 1,700 bottles shipped the day before year end, FOB destination, still in transit
• 530 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["6,270", "6,800", "3,300", "7,970", "2,770"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 3,300 − 530 + the shipping-point shipment = 6,270.$q$),
  ($q$g-transit-09$q$, 1198, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 6,850 bottles. Also:
• 3,300 bottles shipped two days before year end, FOB shipping point, still in transit
• 1,800 bottles shipped the day before year end, FOB destination, still in transit
• 530 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["9,620", "10,150", "6,850", "11,420", "6,320"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 6,850 − 530 + the shipping-point shipment = 9,620.$q$),
  ($q$g-transit-10$q$, 1199, $q$Kombucha Canada$q$, $q$Ending units$q$, $q$The year-end count finds 6,850 bottles. Also:
• 2,600 bottles shipped two days before year end, FOB destination, still in transit
• 1,300 bottles shipped the day before year end, FOB shipping point, still in transit
• 290 bottles on the floor are consignment goods held for another distributor

How many bottles belong in ending inventory?$q$, $q$["7,860", "8,150", "6,850", "10,460", "6,560"]$q$::jsonb, 0, $q$FOB shipping point goods in transit are the buyer's; FOB destination goods are still the seller's. Consignment goods belong to the consignor and come out of the count. 6,850 − 290 + the shipping-point shipment = 7,860.$q$),
  ($q$g-fifo-01$q$, 1200, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,400 bottles at $3.002
• Purchase 1: 1,600 bottles at $3.150
• Purchase 2: 2,200 bottles at $3.183

1,340 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$14,982", "$4,265", "$15,225", "$15,087", "$15,004"]$q$::jsonb, 0, $q$Goods available $19,247 for 6,200 bottles. FIFO leaves the newest 1,340 on hand: $4,265. COGS = $19,247 − $4,265 = $14,982.$q$),
  ($q$g-avg-01$q$, 1201, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,900 bottles at $3.100
• Purchase 1: 4,400 bottles at $3.209
• Purchase 2: 4,300 bottles at $3.295

2,520 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$26,053", "$25,875", "$8,125", "$26,299", "$25,867"]$q$::jsonb, 0, $q$Average = $34,178.10 ÷ 10,600 = $3.2243. Sold = 10,600 − 2,520 = 8,080. COGS = $26,053. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-02$q$, 1202, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 1,800 bottles at $2.977
• Purchase 1: 2,100 bottles at $2.993
• Purchase 2: 4,800 bottles at $3.182

2,400 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$19,281", "$7,637", "$19,763", "$19,492", "$19,343"]$q$::jsonb, 0, $q$Goods available $26,918 for 8,700 bottles. FIFO leaves the newest 2,400 on hand: $7,637. COGS = $26,918 − $7,637 = $19,281.$q$),
  ($q$g-avg-02$q$, 1203, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,300 bottles at $3.103
• Purchase 1: 5,800 bottles at $3.279
• Purchase 2: 2,700 bottles at $3.334
• Purchase 3: 4,700 bottles at $3.569

7,710 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$22,865", "$22,036", "$25,963", "$23,742", "$22,551"]$q$::jsonb, 0, $q$Average = $48,828.20 ÷ 14,500 = $3.3675. Sold = 14,500 − 7,710 = 6,790. COGS = $22,865. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-03$q$, 1204, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,800 bottles at $3.061
• Purchase 1: 3,800 bottles at $3.247
• Purchase 2: 2,200 bottles at $3.462
• Purchase 3: 2,700 bottles at $3.556

5,560 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$18,766", "$19,361", "$20,594", "$19,693", "$19,325"]$q$::jsonb, 0, $q$Goods available $38,127 for 11,500 bottles. FIFO leaves the newest 5,560 on hand: $19,361. COGS = $38,127 − $19,361 = $18,766.$q$),
  ($q$g-avg-03$q$, 1205, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,300 bottles at $3.181
• Purchase 1: 5,100 bottles at $3.363
• Purchase 2: 2,800 bottles at $3.535

4,130 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$17,185", "$16,814", "$13,999", "$17,532", "$17,034"]$q$::jsonb, 0, $q$Average = $31,184.60 ÷ 9,200 = $3.3896. Sold = 9,200 − 4,130 = 5,070. COGS = $17,185. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-04$q$, 1206, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 1,900 bottles at $2.905
• Purchase 1: 4,700 bottles at $3.118
• Purchase 2: 4,600 bottles at $3.115
• Purchase 3: 5,700 bottles at $3.043

6,140 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$33,133", "$18,716", "$33,108", "$33,011", "$32,634"]$q$::jsonb, 0, $q$Goods available $51,848 for 16,900 bottles. FIFO leaves the newest 6,140 on hand: $18,716. COGS = $51,848 − $18,716 = $33,133.$q$),
  ($q$g-avg-04$q$, 1207, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,600 bottles at $3.215
• Purchase 1: 2,000 bottles at $3.429
• Purchase 2: 4,900 bottles at $3.675
• Purchase 3: 5,000 bottles at $3.747

4,710 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$31,738", "$31,096", "$17,006", "$32,663", "$30,910"]$q$::jsonb, 0, $q$Average = $48,744.50 ÷ 13,500 = $3.6107. Sold = 13,500 − 4,710 = 8,790. COGS = $31,738. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-05$q$, 1208, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,700 bottles at $3.138
• Purchase 1: 1,500 bottles at $3.059
• Purchase 2: 4,800 bottles at $3.260
• Purchase 3: 2,600 bottles at $3.233

3,530 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$25,677", "$11,438", "$26,103", "$25,820", "$25,595"]$q$::jsonb, 0, $q$Goods available $37,115 for 11,600 bottles. FIFO leaves the newest 3,530 on hand: $11,438. COGS = $37,115 − $11,438 = $25,677.$q$),
  ($q$g-avg-05$q$, 1209, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,400 bottles at $3.220
• Purchase 1: 1,700 bottles at $3.416
• Purchase 2: 3,800 bottles at $3.528
• Purchase 3: 1,800 bottles at $3.669

4,780 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$13,664", "$13,208", "$16,662", "$14,084", "$13,556"]$q$::jsonb, 0, $q$Average = $30,325.80 ÷ 8,700 = $3.4857. Sold = 8,700 − 4,780 = 3,920. COGS = $13,664. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-06$q$, 1210, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,300 bottles at $2.981
• Purchase 1: 1,700 bottles at $3.217
• Purchase 2: 1,700 bottles at $3.419

2,370 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$10,170", "$7,968", "$11,056", "$10,596", "$10,445"]$q$::jsonb, 0, $q$Goods available $18,138 for 5,700 bottles. FIFO leaves the newest 2,370 on hand: $7,968. COGS = $18,138 − $7,968 = $10,170.$q$),
  ($q$g-avg-06$q$, 1211, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,500 bottles at $2.924
• Purchase 1: 4,700 bottles at $2.995
• Purchase 2: 4,200 bottles at $2.925
• Purchase 3: 5,700 bottles at $2.861

7,590 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$24,872", "$25,219", "$22,183", "$24,527", "$24,902"]$q$::jsonb, 0, $q$Average = $47,055.20 ÷ 16,100 = $2.9227. Sold = 16,100 − 7,590 = 8,510. COGS = $24,872. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-07$q$, 1212, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,200 bottles at $3.149
• Purchase 1: 5,300 bottles at $3.281
• Purchase 2: 2,500 bottles at $3.327

3,720 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$20,314", "$12,320", "$20,720", "$20,495", "$20,252"]$q$::jsonb, 0, $q$Goods available $32,635 for 10,000 bottles. FIFO leaves the newest 3,720 on hand: $12,320. COGS = $32,635 − $12,320 = $20,314.$q$),
  ($q$g-avg-07$q$, 1213, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 2,800 bottles at $3.008
• Purchase 1: 1,900 bottles at $3.011
• Purchase 2: 4,900 bottles at $3.043

2,160 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$22,517", "$22,481", "$6,537", "$22,557", "$22,474"]$q$::jsonb, 0, $q$Average = $29,054.00 ÷ 9,600 = $3.0265. Sold = 9,600 − 2,160 = 7,440. COGS = $22,517. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-08$q$, 1214, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,500 bottles at $3.170
• Purchase 1: 5,400 bottles at $3.393
• Purchase 2: 5,700 bottles at $3.470

2,850 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$36,137", "$9,890", "$36,914", "$36,381", "$36,188"]$q$::jsonb, 0, $q$Goods available $46,026 for 13,600 bottles. FIFO leaves the newest 2,850 on hand: $9,890. COGS = $46,026 − $9,890 = $36,137.$q$),
  ($q$g-avg-08$q$, 1215, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 1,700 bottles at $3.191
• Purchase 1: 2,700 bottles at $3.218
• Purchase 2: 1,600 bottles at $3.385

2,950 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$9,927", "$9,769", "$9,602", "$10,082", "$9,957"]$q$::jsonb, 0, $q$Average = $19,529.30 ÷ 6,000 = $3.2549. Sold = 6,000 − 2,950 = 3,050. COGS = $9,927. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-09$q$, 1216, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 2,900 bottles at $2.989
• Purchase 1: 5,400 bottles at $3.101
• Purchase 2: 4,900 bottles at $3.122
• Purchase 3: 2,400 bottles at $3.157

6,780 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$27,037", "$21,251", "$27,588", "$27,301", "$26,882"]$q$::jsonb, 0, $q$Goods available $48,288 for 15,600 bottles. FIFO leaves the newest 6,780 on hand: $21,251. COGS = $48,288 − $21,251 = $27,037.$q$),
  ($q$g-avg-09$q$, 1217, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 2,400 bottles at $3.272
• Purchase 1: 5,400 bottles at $3.278
• Purchase 2: 2,400 bottles at $3.516
• Purchase 3: 5,000 bottles at $3.645

4,880 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$35,453", "$34,430", "$16,765", "$36,235", "$35,374"]$q$::jsonb, 0, $q$Average = $52,217.40 ÷ 15,200 = $3.4354. Sold = 15,200 − 4,880 = 10,320. COGS = $35,453. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-fifo-10$q$, 1218, $q$Kombucha Canada$q$, $q$FIFO$q$, $q$Inventory available for the year, oldest first:
• Opening: 1,900 bottles at $2.923
• Purchase 1: 4,600 bottles at $2.914
• Purchase 2: 4,700 bottles at $3.029
• Purchase 3: 1,900 bottles at $3.003

4,570 bottles are on hand at year end. Under FIFO, what is cost of goods sold?$q$, $q$["$25,107", "$13,793", "$25,566", "$25,330", "$25,058"]$q$::jsonb, 0, $q$Goods available $38,900 for 13,100 bottles. FIFO leaves the newest 4,570 on hand: $13,793. COGS = $38,900 − $13,793 = $25,107.$q$),
  ($q$g-avg-10$q$, 1219, $q$Kombucha Canada$q$, $q$Weighted average$q$, $q$Inventory available for the year:
• Opening: 2,900 bottles at $3.196
• Purchase 1: 3,800 bottles at $3.299
• Purchase 2: 3,600 bottles at $3.291
• Purchase 3: 3,500 bottles at $3.523

5,210 bottles are on hand at year end. Under the weighted-average method, what is cost of goods sold?$q$, $q$["$28,623", "$28,025", "$17,360", "$29,094", "$28,581"]$q$::jsonb, 0, $q$Average = $45,982.70 ÷ 13,800 = $3.3321. Sold = 13,800 − 5,210 = 8,590. COGS = $28,623. (A simple average of the unit prices ignores how many bottles were bought at each.)$q$),
  ($q$g-lcnrv-01$q$, 1220, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,000 bottles at $3.592
• 1,300 bottles at $3.724
• 500 bottles at $3.534

Net realizable value is $3.41 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$12,958", "$13,792", "$12,124", "$13,058", "$12,051"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.41; layers below NRV stay at cost (never written up). Ending inventory $12,958.00, a write-down of $834.20 to COGS.$q$),
  ($q$g-lcnrv-02$q$, 1221, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,900 bottles at $3.239
• 2,800 bottles at $3.515
• 1,100 bottles at $3.013

Net realizable value is $3.58 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$22,549", "$24,344", "$22,649", "$20,971", "$25,706"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.58; layers below NRV stay at cost (never written up). Ending inventory $22,549.40, a write-down of $0.00 to COGS.$q$),
  ($q$g-lcnrv-03$q$, 1222, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 1,300 bottles at $3.643
• 2,200 bottles at $3.664
• 1,700 bottles at $3.592

Net realizable value is $3.60 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$18,706", "$18,903", "$18,720", "$18,510", "$17,397"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.60; layers below NRV stay at cost (never written up). Ending inventory $18,706.40, a write-down of $196.70 to COGS.$q$),
  ($q$g-lcnrv-04$q$, 1223, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,200 bottles at $3.131
• 900 bottles at $3.373
• 500 bottles at $3.145

Net realizable value is $3.18 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$11,323", "$11,496", "$11,448", "$11,149", "$10,530"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.18; layers below NRV stay at cost (never written up). Ending inventory $11,322.70, a write-down of $173.70 to COGS.$q$),
  ($q$g-lcnrv-05$q$, 1224, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,300 bottles at $3.066
• 700 bottles at $3.505
• 600 bottles at $3.089

Net realizable value is $3.48 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$11,341", "$11,359", "$12,528", "$11,324", "$10,547"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.48; layers below NRV stay at cost (never written up). Ending inventory $11,341.20, a write-down of $17.50 to COGS.$q$),
  ($q$g-lcnrv-06$q$, 1225, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 500 bottles at $3.275
• 2,400 bottles at $3.133
• 800 bottles at $3.781

Net realizable value is $3.55 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$11,997", "$12,182", "$13,135", "$11,812", "$11,157"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.55; layers below NRV stay at cost (never written up). Ending inventory $11,996.70, a write-down of $184.80 to COGS.$q$),
  ($q$g-lcnrv-07$q$, 1226, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,800 bottles at $3.718
• 2,500 bottles at $3.146
• 1,100 bottles at $3.287

Net realizable value is $3.58 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$21,505", "$21,891", "$22,912", "$21,118", "$19,999"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.58; layers below NRV stay at cost (never written up). Ending inventory $21,504.70, a write-down of $386.40 to COGS.$q$),
  ($q$g-lcnrv-08$q$, 1227, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 1,600 bottles at $3.662
• 2,200 bottles at $3.623
• 2,400 bottles at $3.334

Net realizable value is $3.11 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$19,282", "$21,831", "$16,733", "$19,382", "$17,932"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.11; layers below NRV stay at cost (never written up). Ending inventory $19,282.00, a write-down of $2,549.40 to COGS.$q$),
  ($q$g-lcnrv-09$q$, 1228, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,300 bottles at $3.427
• 1,400 bottles at $3.001
• 2,600 bottles at $3.583

Net realizable value is $3.48 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$21,132", "$21,399", "$21,924", "$20,864", "$19,652"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.48; layers below NRV stay at cost (never written up). Ending inventory $21,131.50, a write-down of $267.80 to COGS.$q$),
  ($q$g-lcnrv-10$q$, 1229, $q$Kombucha Canada$q$, $q$Lower of cost and NRV$q$, $q$Ending inventory, by layer:
• 2,600 bottles at $3.223
• 2,900 bottles at $3.579
• 2,400 bottles at $3.732

Net realizable value is $3.33 per bottle. Applying lower of cost and NRV item by item, what is ending inventory?$q$, $q$["$26,029", "$27,716", "$26,307", "$24,342", "$24,207"]$q$::jsonb, 0, $q$Write down only the layers costing more than $3.33; layers below NRV stay at cost (never written up). Ending inventory $26,028.80, a write-down of $1,686.90 to COGS.$q$),
  ($q$g-bookrec-01$q$, 1230, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $12,749.91 at month end. The bank statement shows:
• Service charges $53.37, including a $25 NSF fee
• A customer's cheque for $1,063.82 returned NSF
• Interest earned of $10.55

Also, a cheque for supplies cleared the bank at $1,064.21 but was recorded in the books as $614.21.

What is the adjusted cash balance per company records?$q$, $q$["$11,193.27", "$12,093.27", "$11,168.27", "$11,172.17", "$12,257.09"]$q$::jsonb, 0, $q$Start $12,749.91; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $450.00 recording error (disbursement understated). Adjusted = $11,193.27.$q$),
  ($q$g-bookrec-02$q$, 1231, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $7,318.54 at month end. The bank statement shows:
• An automatic payroll deduction of $619.71 not yet recorded
• An automatic insurance withdrawal of $238.97 not yet recorded
• Service charges $54.15, including a $25 NSF fee
• A customer's cheque for $1,790.48 returned NSF
• Interest earned of $10.26

Also, a cheque for supplies cleared the bank at $409.79 but was recorded in the books as $499.79.

What is the adjusted cash balance per company records?$q$, $q$["$4,715.49", "$4,535.49", "$4,690.49", "$5,335.20", "$4,694.97"]$q$::jsonb, 0, $q$Start $7,318.54; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $90.00 recording error (disbursement overstated). Adjusted = $4,715.49.$q$),
  ($q$g-bookrec-03$q$, 1232, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $6,871.44 at month end. The bank statement shows:
• An automatic payroll deduction of $562.24 not yet recorded
• Service charges $46.90, including a $20 NSF fee
• A customer's cheque for $2,307.83 returned NSF
• Interest earned of $32.63

Also, a cheque for supplies cleared the bank at $937.78 but was recorded in the books as $1,027.78.

What is the adjusted cash balance per company records?$q$, $q$["$4,077.10", "$3,897.10", "$4,057.10", "$4,639.34", "$4,011.84"]$q$::jsonb, 0, $q$Start $6,871.44; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $90.00 recording error (disbursement overstated). Adjusted = $4,077.10.$q$),
  ($q$g-bookrec-04$q$, 1233, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $9,539.67 at month end. The bank statement shows:
• An automatic insurance withdrawal of $514.91 not yet recorded
• Service charges $50.52, including a $20 NSF fee
• A customer's cheque for $1,070.79 returned NSF

Also, a cheque for supplies cleared the bank at $706.90 but was recorded in the books as $976.90.

What is the adjusted cash balance per company records?$q$, $q$["$8,173.45", "$7,633.45", "$8,153.45", "$9,244.24", "$7,601.31"]$q$::jsonb, 0, $q$Start $9,539.67; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $270.00 recording error (disbursement overstated). Adjusted = $8,173.45.$q$),
  ($q$g-bookrec-05$q$, 1234, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $11,712.60 at month end. The bank statement shows:
• Service charges $43.58, including a $25 NSF fee
• A customer's cheque for $2,344.93 returned NSF
• Interest earned of $28.35

Also, a cheque for supplies cleared the bank at $1,284.04 but was recorded in the books as $1,554.04.

What is the adjusted cash balance per company records?$q$, $q$["$9,622.44", "$9,082.44", "$9,597.44", "$9,565.74", "$11,967.37"]$q$::jsonb, 0, $q$Start $11,712.60; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $270.00 recording error (disbursement overstated). Adjusted = $9,622.44.$q$),
  ($q$g-bookrec-06$q$, 1235, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $9,932.68 at month end. The bank statement shows:
• An automatic insurance withdrawal of $333.50 not yet recorded
• Service charges $39.71, including a $20 NSF fee
• A customer's cheque for $1,841.56 returned NSF
• Interest earned of $25.32

Also, a cheque for supplies cleared the bank at $446.04 but was recorded in the books as $626.04.

What is the adjusted cash balance per company records?$q$, $q$["$7,923.23", "$7,563.23", "$7,903.23", "$7,872.59", "$9,764.79"]$q$::jsonb, 0, $q$Start $9,932.68; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $180.00 recording error (disbursement overstated). Adjusted = $7,923.23.$q$),
  ($q$g-bookrec-07$q$, 1236, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $12,856.52 at month end. The bank statement shows:
• Service charges $29.06, including a $15 NSF fee
• A customer's cheque for $1,311.49 returned NSF

Also, a cheque for supplies cleared the bank at $855.07 but was recorded in the books as $828.07.

What is the adjusted cash balance per company records?$q$, $q$["$11,488.97", "$11,542.97", "$11,473.97", "$12,800.46", "$10,684.74"]$q$::jsonb, 0, $q$Start $12,856.52; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $27.00 recording error (disbursement understated). Adjusted = $11,488.97.$q$),
  ($q$g-bookrec-08$q$, 1237, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $10,700.24 at month end. The bank statement shows:
• Service charges $29.85, including a $15 NSF fee
• A customer's cheque for $1,101.17 returned NSF
• Interest earned of $8.83

Also, a cheque for supplies cleared the bank at $1,165.64 but was recorded in the books as $985.64.

What is the adjusted cash balance per company records?$q$, $q$["$9,398.05", "$9,758.05", "$9,383.05", "$9,380.39", "$10,499.22"]$q$::jsonb, 0, $q$Start $10,700.24; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $180.00 recording error (disbursement understated). Adjusted = $9,398.05.$q$),
  ($q$g-bookrec-09$q$, 1238, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $12,294.95 at month end. The bank statement shows:
• An automatic payroll deduction of $617.86 not yet recorded
• An automatic insurance withdrawal of $198.12 not yet recorded
• Service charges $64.29, including a $25 NSF fee
• A customer's cheque for $642.75 returned NSF
• Interest earned of $21.66

Also, a cheque for supplies cleared the bank at $1,166.72 but was recorded in the books as $1,463.72.

What is the adjusted cash balance per company records?$q$, $q$["$11,090.59", "$10,496.59", "$11,065.59", "$11,708.45", "$11,047.27"]$q$::jsonb, 0, $q$Start $12,294.95; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $297.00 recording error (disbursement overstated). Adjusted = $11,090.59.$q$),
  ($q$g-bookrec-10$q$, 1239, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $6,451.59 at month end. The bank statement shows:
• An automatic payroll deduction of $1,188.11 not yet recorded
• An automatic insurance withdrawal of $194.33 not yet recorded
• Service charges $35.49, including a $15 NSF fee
• A customer's cheque for $1,661.94 returned NSF

Also, a cheque for supplies cleared the bank at $1,745.09 but was recorded in the books as $1,475.09.

What is the adjusted cash balance per company records?$q$, $q$["$3,101.72", "$3,641.72", "$3,086.72", "$4,289.83", "$4,763.66"]$q$::jsonb, 0, $q$Start $6,451.59; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $270.00 recording error (disbursement understated). Adjusted = $3,101.72.$q$),
  ($q$g-bookrec-11$q$, 1240, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $14,813.30 at month end. The bank statement shows:
• An automatic insurance withdrawal of $335.78 not yet recorded
• Service charges $56.69, including a $25 NSF fee
• A customer's cheque for $1,528.05 returned NSF
• Interest earned of $33.89

Also, a cheque for supplies cleared the bank at $1,375.79 but was recorded in the books as $1,465.79.

What is the adjusted cash balance per company records?$q$, $q$["$13,016.67", "$12,836.67", "$12,991.67", "$12,948.89", "$14,544.72"]$q$::jsonb, 0, $q$Start $14,813.30; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $90.00 recording error (disbursement overstated). Adjusted = $13,016.67.$q$),
  ($q$g-bookrec-12$q$, 1241, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $11,605.87 at month end. The bank statement shows:
• An automatic payroll deduction of $862.94 not yet recorded
• Service charges $39.67, including a $20 NSF fee
• A customer's cheque for $1,644.40 returned NSF
• Interest earned of $39.27

Also, a cheque for supplies cleared the bank at $1,432.87 but was recorded in the books as $1,882.87.

What is the adjusted cash balance per company records?$q$, $q$["$9,548.13", "$8,648.13", "$9,528.13", "$10,411.07", "$9,469.59"]$q$::jsonb, 0, $q$Start $11,605.87; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $450.00 recording error (disbursement overstated). Adjusted = $9,548.13.$q$),
  ($q$g-bookrec-13$q$, 1242, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $9,125.38 at month end. The bank statement shows:
• An automatic insurance withdrawal of $263.64 not yet recorded
• Service charges $31.88, including a $20 NSF fee
• A customer's cheque for $1,135.93 returned NSF

Also, a cheque for supplies cleared the bank at $1,166.17 but was recorded in the books as $716.17.

What is the adjusted cash balance per company records?$q$, $q$["$7,243.93", "$8,143.93", "$7,223.93", "$8,379.86", "$6,736.85"]$q$::jsonb, 0, $q$Start $9,125.38; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $450.00 recording error (disbursement understated). Adjusted = $7,243.93.$q$),
  ($q$g-bookrec-14$q$, 1243, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $6,735.96 at month end. The bank statement shows:
• An automatic insurance withdrawal of $403.73 not yet recorded
• Service charges $28.37, including a $15 NSF fee
• A customer's cheque for $524.49 returned NSF

Also, a cheque for supplies cleared the bank at $658.61 but was recorded in the books as $748.61.

What is the adjusted cash balance per company records?$q$, $q$["$5,869.37", "$5,689.37", "$5,854.37", "$6,393.86", "$5,458.51"]$q$::jsonb, 0, $q$Start $6,735.96; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $90.00 recording error (disbursement overstated). Adjusted = $5,869.37.$q$),
  ($q$g-bookrec-15$q$, 1244, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $9,243.42 at month end. The bank statement shows:
• An automatic payroll deduction of $830.70 not yet recorded
• An automatic insurance withdrawal of $157.93 not yet recorded
• Service charges $54.72, including a $25 NSF fee
• A customer's cheque for $1,085.88 returned NSF
• Interest earned of $16.65

Also, a cheque for supplies cleared the bank at $1,248.34 but was recorded in the books as $1,158.34.

What is the adjusted cash balance per company records?$q$, $q$["$7,040.84", "$7,220.84", "$7,015.84", "$7,871.54", "$7,007.54"]$q$::jsonb, 0, $q$Start $9,243.42; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $90.00 recording error (disbursement understated). Adjusted = $7,040.84.$q$),
  ($q$g-bookrec-16$q$, 1245, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $10,430.86 at month end. The bank statement shows:
• An automatic payroll deduction of $893.45 not yet recorded
• An automatic insurance withdrawal of $172.40 not yet recorded
• Service charges $64.20, including a $25 NSF fee
• A customer's cheque for $2,018.59 returned NSF

Also, a cheque for supplies cleared the bank at $1,280.32 but was recorded in the books as $1,100.32.

What is the adjusted cash balance per company records?$q$, $q$["$7,102.22", "$7,462.22", "$7,077.22", "$7,995.67", "$9,120.81"]$q$::jsonb, 0, $q$Start $10,430.86; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $180.00 recording error (disbursement understated). Adjusted = $7,102.22.$q$),
  ($q$g-bookrec-17$q$, 1246, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $13,459.98 at month end. The bank statement shows:
• Service charges $36.70, including a $20 NSF fee
• A customer's cheque for $1,710.01 returned NSF
• Interest earned of $27.79

Also, a cheque for supplies cleared the bank at $580.29 but was recorded in the books as $1,030.29.

What is the adjusted cash balance per company records?$q$, $q$["$12,191.06", "$11,291.06", "$12,171.06", "$12,135.48", "$13,901.07"]$q$::jsonb, 0, $q$Start $13,459.98; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $450.00 recording error (disbursement overstated). Adjusted = $12,191.06.$q$),
  ($q$g-bookrec-18$q$, 1247, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $13,240.51 at month end. The bank statement shows:
• Service charges $37.25, including a $25 NSF fee
• A customer's cheque for $440.58 returned NSF

Also, a cheque for supplies cleared the bank at $949.80 but was recorded in the books as $1,039.80.

What is the adjusted cash balance per company records?$q$, $q$["$12,852.68", "$12,672.68", "$12,827.68", "$13,293.26", "$11,952.99"]$q$::jsonb, 0, $q$Start $13,240.51; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; add back the $90.00 recording error (disbursement overstated). Adjusted = $12,852.68.$q$),
  ($q$g-bookrec-19$q$, 1248, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $14,558.35 at month end. The bank statement shows:
• An automatic insurance withdrawal of $293.65 not yet recorded
• Service charges $37.65, including a $15 NSF fee
• A customer's cheque for $2,107.26 returned NSF

Also, a cheque for supplies cleared the bank at $1,008.60 but was recorded in the books as $828.60.

What is the adjusted cash balance per company records?$q$, $q$["$11,939.79", "$12,299.79", "$11,924.79", "$14,047.05", "$11,104.00"]$q$::jsonb, 0, $q$Start $14,558.35; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $180.00 recording error (disbursement understated). Adjusted = $11,939.79.$q$),
  ($q$g-bookrec-20$q$, 1249, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The books show cash of $8,965.77 at month end. The bank statement shows:
• An automatic payroll deduction of $808.01 not yet recorded
• Service charges $43.51, including a $20 NSF fee
• A customer's cheque for $994.52 returned NSF

Also, a cheque for supplies cleared the bank at $1,477.56 but was recorded in the books as $1,297.56.

What is the adjusted cash balance per company records?$q$, $q$["$6,939.73", "$7,299.73", "$6,919.73", "$7,747.74", "$7,934.25"]$q$::jsonb, 0, $q$Start $8,965.77; subtract unrecorded withdrawals, the service charge (the NSF fee is already inside it), and the NSF cheque; add interest; subtract the $180.00 recording error (disbursement understated). Adjusted = $6,939.73.$q$),
  ($q$g-bankrec-01$q$, 1250, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $9,108.96.
• A deposit of $1,197.02 made after the bank's cutoff on the last day
• Cheque #40 for $1,186.54, not yet cleared
• Cheque #41 for $1,319.32, not yet cleared
• Cheque #12 for $111.87, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $144.28 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$7,832.53", "$7,944.40", "$7,543.97", "$5,438.49", "$10,471.17"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $7,832.53.$q$),
  ($q$g-bankrec-02$q$, 1251, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $9,593.97.
• A deposit of $1,026.03 made after the bank's cutoff on the last day
• Cheque #40 for $1,345.69, not yet cleared
• Cheque #41 for $1,964.48, not yet cleared
• Cheque #42 for $1,344.27, not yet cleared
• Cheque #12 for $94.87, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $107.01 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$5,977.70", "$6,072.57", "$5,763.68", "$3,925.64", "$12,595.20"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $5,977.70.$q$),
  ($q$g-bankrec-03$q$, 1252, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $12,344.77.
• A deposit of $2,981.04 made after the bank's cutoff on the last day
• Cheque #40 for $1,198.72, not yet cleared
• Cheque #41 for $833.62, not yet cleared
• Cheque #12 for $37.02, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $254.29 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$13,510.74", "$13,547.76", "$13,002.16", "$7,548.66", "$15,177.98"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $13,510.74.$q$),
  ($q$g-bankrec-04$q$, 1253, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $10,814.72.
• A deposit of $533.43 made after the bank's cutoff on the last day
• Cheque #40 for $849.68, not yet cleared
• Cheque #41 for $1,126.07, not yet cleared
• Cheque #42 for $479.39, not yet cleared
• Cheque #12 for $47.10, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $86.38 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$8,932.29", "$8,979.39", "$8,759.53", "$7,865.43", "$12,143.21"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $8,932.29.$q$),
  ($q$g-bankrec-05$q$, 1254, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $11,988.71.
• A deposit of $1,505.57 made after the bank's cutoff on the last day
• Cheque #40 for $61.49, not yet cleared
• Cheque #41 for $791.60, not yet cleared
• Cheque #42 for $1,099.56, not yet cleared
• Cheque #12 for $31.86, outstanding at last month's reconciliation and still not cleared

What is the adjusted balance per bank?$q$, $q$["$11,509.77", "$11,541.63", "$8,498.63", "$15,292.09", "$10,704.09"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month). Adjusted = $11,509.77.$q$),
  ($q$g-bankrec-06$q$, 1255, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $7,199.10.
• A deposit of $2,533.24 made after the bank's cutoff on the last day
• Cheque #40 for $1,424.03, not yet cleared
• Cheque #41 for $560.58, not yet cleared
• Cheque #42 for $1,051.15, not yet cleared
• Cheque #12 for $98.62, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $117.92 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$6,715.88", "$6,814.50", "$6,480.04", "$1,649.40", "$9,939.34"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $6,715.88.$q$),
  ($q$g-bankrec-07$q$, 1256, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $10,741.48.
• A deposit of $751.67 made after the bank's cutoff on the last day
• Cheque #40 for $890.35, not yet cleared
• Cheque #41 for $422.55, not yet cleared
• Cheque #42 for $1,772.88, not yet cleared
• Cheque #12 for $84.21, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $163.62 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$8,486.78", "$8,570.99", "$8,159.54", "$6,983.44", "$12,877.64"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $8,486.78.$q$),
  ($q$g-bankrec-08$q$, 1257, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $14,919.82.
• A deposit of $1,512.08 made after the bank's cutoff on the last day
• Cheque #40 for $50.62, not yet cleared
• Cheque #41 for $1,497.31, not yet cleared
• Cheque #42 for $1,926.55, not yet cleared
• Cheque #12 for $27.69, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $242.03 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$13,171.76", "$13,199.45", "$12,687.70", "$10,147.60", "$20,019.48"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $13,171.76.$q$),
  ($q$g-bankrec-09$q$, 1258, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $13,713.14.
• A deposit of $2,531.45 made after the bank's cutoff on the last day
• Cheque #40 for $1,114.73, not yet cleared
• Cheque #41 for $723.14, not yet cleared
• Cheque #12 for $74.22, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $72.65 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$14,405.15", "$14,479.37", "$14,259.85", "$9,342.25", "$15,851.43"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $14,405.15.$q$),
  ($q$g-bankrec-10$q$, 1259, $q$Pergola Fish Finders$q$, $q$Bank reconciliation$q$, $q$The bank statement balance is $9,623.88.
• A deposit of $1,203.14 made after the bank's cutoff on the last day
• Cheque #40 for $1,042.68, not yet cleared
• Cheque #41 for $1,779.94, not yet cleared
• Cheque #12 for $53.76, outstanding at last month's reconciliation and still not cleared
• The bank wrongly charged this account $92.56 for another customer's cheque

What is the adjusted balance per bank?$q$, $q$["$8,043.20", "$8,096.96", "$7,858.08", "$5,636.92", "$11,603.08"]$q$::jsonb, 0, $q$Bank side: add deposits in transit, subtract every uncleared cheque (including #12 from last month), and add back the bank’s error. Adjusted = $8,043.20.$q$),
  ($q$g-err-01$q$, 1260, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle delivery expense cleared the bank at $1,560.90. It was recorded in the cash disbursements journal as $1,290.90.

What is the correcting entry?$q$, $q$["DR Delivery Expense $270.00, CR Cash $270.00", "DR Cash $270.00, CR Delivery Expense $270.00", "DR Delivery Expense $1,560.90, CR Cash $1,560.90", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $270.00, CR Cash $270.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too little by $270.00, so take more cash out: DR Delivery Expense $270.00, CR Cash $270.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-02$q$, 1261, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle delivery expense cleared the bank at $1,710.88. It was recorded in the cash disbursements journal as $1,800.88.

What is the correcting entry?$q$, $q$["DR Cash $90.00, CR Delivery Expense $90.00", "DR Delivery Expense $90.00, CR Cash $90.00", "DR Delivery Expense $1,710.88, CR Cash $1,710.88", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $90.00, CR Cash $90.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too much by $90.00, so put cash back: DR Cash $90.00, CR Delivery Expense $90.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-03$q$, 1262, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle supplies cleared the bank at $1,374.04. It was recorded in the cash disbursements journal as $1,104.04.

What is the correcting entry?$q$, $q$["DR Supplies $270.00, CR Cash $270.00", "DR Cash $270.00, CR Supplies $270.00", "DR Supplies $1,374.04, CR Cash $1,374.04", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $270.00, CR Cash $270.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too little by $270.00, so take more cash out: DR Supplies $270.00, CR Cash $270.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-04$q$, 1263, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle an account payable cleared the bank at $1,537.16. It was recorded in the cash disbursements journal as $1,447.16.

What is the correcting entry?$q$, $q$["DR Accounts Payable $90.00, CR Cash $90.00", "DR Cash $90.00, CR Accounts Payable $90.00", "DR Accounts Payable $1,537.16, CR Cash $1,537.16", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $90.00, CR Cash $90.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too little by $90.00, so take more cash out: DR Accounts Payable $90.00, CR Cash $90.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-05$q$, 1264, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle supplies cleared the bank at $1,515.64. It was recorded in the cash disbursements journal as $1,245.64.

What is the correcting entry?$q$, $q$["DR Supplies $270.00, CR Cash $270.00", "DR Cash $270.00, CR Supplies $270.00", "DR Supplies $1,515.64, CR Cash $1,515.64", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $270.00, CR Cash $270.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too little by $270.00, so take more cash out: DR Supplies $270.00, CR Cash $270.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-06$q$, 1265, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle utilities expense cleared the bank at $1,222.44. It was recorded in the cash disbursements journal as $322.44.

What is the correcting entry?$q$, $q$["DR Utilities Expense $900.00, CR Cash $900.00", "DR Cash $900.00, CR Utilities Expense $900.00", "DR Utilities Expense $1,222.44, CR Cash $1,222.44", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $900.00, CR Cash $900.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too little by $900.00, so take more cash out: DR Utilities Expense $900.00, CR Cash $900.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-07$q$, 1266, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle supplies cleared the bank at $833.65. It was recorded in the cash disbursements journal as −$66.35.

What is the correcting entry?$q$, $q$["DR Supplies $900.00, CR Cash $900.00", "DR Cash $900.00, CR Supplies $900.00", "DR Supplies $833.65, CR Cash $833.65", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $900.00, CR Cash $900.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too little by $900.00, so take more cash out: DR Supplies $900.00, CR Cash $900.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-08$q$, 1267, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle supplies cleared the bank at $2,281.35. It was recorded in the cash disbursements journal as $2,551.35.

What is the correcting entry?$q$, $q$["DR Cash $270.00, CR Supplies $270.00", "DR Supplies $270.00, CR Cash $270.00", "DR Supplies $2,281.35, CR Cash $2,281.35", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $270.00, CR Cash $270.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too much by $270.00, so put cash back: DR Cash $270.00, CR Supplies $270.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-09$q$, 1268, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle an account payable cleared the bank at $2,179.58. It was recorded in the cash disbursements journal as $2,206.58.

What is the correcting entry?$q$, $q$["DR Cash $27.00, CR Accounts Payable $27.00", "DR Accounts Payable $27.00, CR Cash $27.00", "DR Accounts Payable $2,179.58, CR Cash $2,179.58", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $27.00, CR Cash $27.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too much by $27.00, so put cash back: DR Cash $27.00, CR Accounts Payable $27.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-err-10$q$, 1269, $q$Pergola Fish Finders$q$, $q$Correcting entries$q$, $q$A cheque to settle an account payable cleared the bank at $2,492.22. It was recorded in the cash disbursements journal as $2,537.22.

What is the correcting entry?$q$, $q$["DR Cash $45.00, CR Accounts Payable $45.00", "DR Accounts Payable $45.00, CR Cash $45.00", "DR Accounts Payable $2,492.22, CR Cash $2,492.22", "No entry — it's a bank-side reconciling item", "DR Bank Charges Expense $45.00, CR Cash $45.00"]$q$::jsonb, 0, $q$The bank processed the real amount. The books recorded too much by $45.00, so put cash back: DR Cash $45.00, CR Accounts Payable $45.00. Because the company made the error, the correction goes on the company side.$q$),
  ($q$g-sl-01$q$, 1270, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($209,000) and a building ($406,000) were bought on the first day of a fiscal year. The building has a 30-year life and a $14,000 residual value, depreciated straight-line.

After 3 full years, what is the combined carrying amount of land and building?$q$, $q$["$575,800", "$574,400", "$554,900", "$366,800", "$588,867"]$q$::jsonb, 0, $q$Building: ($406,000 − $14,000) ÷ 30 = $13,067 a year; after 3 years its carrying amount is $366,800. Land is never depreciated. Total $575,800.$q$),
  ($q$g-sl-02$q$, 1271, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($196,000) and a building ($254,000) were bought on the first day of a fiscal year. The building has a 20-year life and a $46,000 residual value, depreciated straight-line.

After 3 full years, what is the combined carrying amount of land and building?$q$, $q$["$418,800", "$411,900", "$389,400", "$222,800", "$429,200"]$q$::jsonb, 0, $q$Building: ($254,000 − $46,000) ÷ 20 = $10,400 a year; after 3 years its carrying amount is $222,800. Land is never depreciated. Total $418,800.$q$),
  ($q$g-sl-03$q$, 1272, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($109,000) and a building ($342,000) were bought on the first day of a fiscal year. The building has a 25-year life and a $27,000 residual value, depreciated straight-line.

After 6 full years, what is the combined carrying amount of land and building?$q$, $q$["$375,400", "$368,920", "$349,240", "$266,400", "$388,000"]$q$::jsonb, 0, $q$Building: ($342,000 − $27,000) ÷ 25 = $12,600 a year; after 6 years its carrying amount is $266,400. Land is never depreciated. Total $375,400.$q$),
  ($q$g-sl-04$q$, 1273, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($289,000) and a building ($220,000) were bought on the first day of a fiscal year. The building has a 30-year life and a $28,000 residual value, depreciated straight-line.

After 2 full years, what is the combined carrying amount of land and building?$q$, $q$["$496,200", "$494,333", "$476,933", "$207,200", "$502,600"]$q$::jsonb, 0, $q$Building: ($220,000 − $28,000) ÷ 30 = $6,400 a year; after 2 years its carrying amount is $207,200. Land is never depreciated. Total $496,200.$q$),
  ($q$g-sl-05$q$, 1274, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($110,000) and a building ($166,000) were bought on the first day of a fiscal year. The building has a 20-year life and a $51,000 residual value, depreciated straight-line.

After 2 full years, what is the combined carrying amount of land and building?$q$, $q$["$264,500", "$259,400", "$253,500", "$154,500", "$270,250"]$q$::jsonb, 0, $q$Building: ($166,000 − $51,000) ÷ 20 = $5,750 a year; after 2 years its carrying amount is $154,500. Land is never depreciated. Total $264,500.$q$),
  ($q$g-sl-06$q$, 1275, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($261,000) and a building ($193,000) were bought on the first day of a fiscal year. The building has a 20-year life and a $5,000 residual value, depreciated straight-line.

After 2 full years, what is the combined carrying amount of land and building?$q$, $q$["$435,200", "$434,700", "$409,100", "$174,200", "$444,600"]$q$::jsonb, 0, $q$Building: ($193,000 − $5,000) ÷ 20 = $9,400 a year; after 2 years its carrying amount is $174,200. Land is never depreciated. Total $435,200.$q$),
  ($q$g-sl-07$q$, 1276, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($234,000) and a building ($272,000) were bought on the first day of a fiscal year. The building has a 25-year life and a $1,000 residual value, depreciated straight-line.

After 5 full years, what is the combined carrying amount of land and building?$q$, $q$["$451,800", "$451,600", "$405,000", "$217,800", "$462,640"]$q$::jsonb, 0, $q$Building: ($272,000 − $1,000) ÷ 25 = $10,840 a year; after 5 years its carrying amount is $217,800. Land is never depreciated. Total $451,800.$q$),
  ($q$g-sl-08$q$, 1277, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($148,000) and a building ($392,000) were bought on the first day of a fiscal year. The building has a 40-year life and a $46,000 residual value, depreciated straight-line.

After 4 full years, what is the combined carrying amount of land and building?$q$, $q$["$505,400", "$500,800", "$490,600", "$357,400", "$514,050"]$q$::jsonb, 0, $q$Building: ($392,000 − $46,000) ÷ 40 = $8,650 a year; after 4 years its carrying amount is $357,400. Land is never depreciated. Total $505,400.$q$),
  ($q$g-sl-09$q$, 1278, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($170,000) and a building ($374,000) were bought on the first day of a fiscal year. The building has a 40-year life and a $59,000 residual value, depreciated straight-line.

After 4 full years, what is the combined carrying amount of land and building?$q$, $q$["$512,500", "$506,600", "$495,500", "$342,500", "$520,375"]$q$::jsonb, 0, $q$Building: ($374,000 − $59,000) ÷ 40 = $7,875 a year; after 4 years its carrying amount is $342,500. Land is never depreciated. Total $512,500.$q$),
  ($q$g-sl-10$q$, 1279, $q$Barry's Batting Cages$q$, $q$Straight-line depreciation$q$, $q$Land ($237,000) and a building ($345,000) were bought on the first day of a fiscal year. The building has a 40-year life and a $33,000 residual value, depreciated straight-line.

After 4 full years, what is the combined carrying amount of land and building?$q$, $q$["$550,800", "$547,500", "$527,100", "$313,800", "$558,600"]$q$::jsonb, 0, $q$Building: ($345,000 − $33,000) ÷ 40 = $7,800 a year; after 4 years its carrying amount is $313,800. Land is never depreciated. Total $550,800.$q$),
  ($q$g-uop-01$q$, 1280, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $3,200, has a residual value of $0 and a life of 500,000 balls, depreciated by units of production. This year it pitched 132,200 balls.

What is this year's depreciation?$q$, $q$["$846.08", "$1,015.30", "$640.00", "$423.04", "$786.85"]$q$::jsonb, 0, $q$Rate = ($3,200 − $0) ÷ 500,000 = $0.006400 per ball. × 132,200 = $846.08.$q$),
  ($q$g-uop-02$q$, 1281, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $8,200, has a residual value of $100 and a life of 1,000,000 balls, depreciated by units of production. This year it pitched 105,030 balls.

What is this year's depreciation?$q$, $q$["$850.74", "$861.25", "$1,020.89", "$1,620.00", "$860.74"]$q$::jsonb, 0, $q$Rate = ($8,200 − $100) ÷ 1,000,000 = $0.008100 per ball. × 105,030 = $850.74.$q$),
  ($q$g-uop-03$q$, 1282, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $8,300, has a residual value of $500 and a life of 500,000 balls, depreciated by units of production. This year it pitched 50,400 balls.

What is this year's depreciation?$q$, $q$["$786.24", "$836.64", "$943.49", "$1,560.00", "$836.24"]$q$::jsonb, 0, $q$Rate = ($8,300 − $500) ÷ 500,000 = $0.015600 per ball. × 50,400 = $786.24.$q$),
  ($q$g-uop-04$q$, 1283, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $3,700, has a residual value of $300 and a life of 800,000 balls, depreciated by units of production. This year it pitched 60,280 balls.

What is this year's depreciation?$q$, $q$["$256.19", "$278.80", "$307.43", "$680.00", "$286.19"]$q$::jsonb, 0, $q$Rate = ($3,700 − $300) ÷ 800,000 = $0.004250 per ball. × 60,280 = $256.19.$q$),
  ($q$g-uop-05$q$, 1284, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $3,500, has a residual value of $300 and a life of 800,000 balls, depreciated by units of production. This year it pitched 100,190 balls.

What is this year's depreciation?$q$, $q$["$400.76", "$438.33", "$480.91", "$640.00", "$430.76"]$q$::jsonb, 0, $q$Rate = ($3,500 − $300) ÷ 800,000 = $0.004000 per ball. × 100,190 = $400.76.$q$),
  ($q$g-uop-06$q$, 1285, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $3,400, has a residual value of $400 and a life of 1,000,000 balls, depreciated by units of production. This year it pitched 87,650 balls.

What is this year's depreciation?$q$, $q$["$262.95", "$298.01", "$315.54", "$600.00", "$302.95"]$q$::jsonb, 0, $q$Rate = ($3,400 − $400) ÷ 1,000,000 = $0.003000 per ball. × 87,650 = $262.95.$q$),
  ($q$g-uop-07$q$, 1286, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $7,900, has a residual value of $0 and a life of 800,000 balls, depreciated by units of production. This year it pitched 134,940 balls.

What is this year's depreciation?$q$, $q$["$1,332.53", "$1,599.04", "$1,580.00", "$1,066.03", "$1,239.26"]$q$::jsonb, 0, $q$Rate = ($7,900 − $0) ÷ 800,000 = $0.009875 per ball. × 134,940 = $1,332.53.$q$),
  ($q$g-uop-08$q$, 1287, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $4,200, has a residual value of $500 and a life of 500,000 balls, depreciated by units of production. This year it pitched 66,840 balls.

What is this year's depreciation?$q$, $q$["$494.62", "$561.46", "$593.54", "$740.00", "$544.62"]$q$::jsonb, 0, $q$Rate = ($4,200 − $500) ÷ 500,000 = $0.007400 per ball. × 66,840 = $494.62.$q$),
  ($q$g-uop-09$q$, 1288, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $5,700, has a residual value of $600 and a life of 500,000 balls, depreciated by units of production. This year it pitched 67,140 balls.

What is this year's depreciation?$q$, $q$["$684.83", "$765.40", "$821.79", "$1,020.00", "$744.83"]$q$::jsonb, 0, $q$Rate = ($5,700 − $600) ÷ 500,000 = $0.010200 per ball. × 67,140 = $684.83.$q$),
  ($q$g-uop-10$q$, 1289, $q$Barry's Batting Cages$q$, $q$Units of production$q$, $q$A pitching machine cost $6,600, has a residual value of $100 and a life of 800,000 balls, depreciated by units of production. This year it pitched 43,820 balls.

What is this year's depreciation?$q$, $q$["$356.04", "$361.52", "$427.25", "$1,300.00", "$366.04"]$q$::jsonb, 0, $q$Rate = ($6,600 − $100) ÷ 800,000 = $0.008125 per ball. × 43,820 = $356.04.$q$),
  ($q$g-ddb-01$q$, 1290, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $38,000, has a residual value of $2,000 and a 6-year life, depreciated by the declining-balance method (rate = 1/6).

What is depreciation in year 2?$q$, $q$["$5,277.78", "$5,000.00", "$6,000.00", "$6,333.33", "$10,555.56"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 2 = $31,666.67. Year-2 depreciation = $5,277.78.$q$),
  ($q$g-ddb-02$q$, 1291, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $36,000, has a residual value of $7,900 and a 5-year life, depreciated by the double-declining-balance method (rate = 2 × 1/5).

What is depreciation in year 5?$q$, $q$["$0.00", "$1,866.24", "$1,456.70", "$5,620.00", "$933.12"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $7,900.00. The full rate would take book value below the residual, so depreciation stops at the residual. Year-5 depreciation = $0.00.$q$),
  ($q$g-ddb-03$q$, 1292, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $8,000, has a residual value of $600 and a 4-year life, depreciated by the double-declining-balance method (rate = 2 × 1/4).

What is depreciation in year 2?$q$, $q$["$2,000.00", "$1,850.00", "$4,000.00", "$1,000.00", "$1,860.00"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 2 = $4,000.00. Year-2 depreciation = $2,000.00.$q$),
  ($q$g-ddb-04$q$, 1293, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $39,000, has a residual value of $7,100 and a 5-year life, depreciated by the declining-balance method (rate = 1/5).

What is depreciation in year 3?$q$, $q$["$4,992.00", "$4,083.20", "$6,380.00", "$6,240.00", "$9,984.00"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 3 = $24,960.00. Year-3 depreciation = $4,992.00.$q$),
  ($q$g-ddb-05$q$, 1294, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $31,000, has a residual value of $3,600 and a 6-year life, depreciated by the double-declining-balance method (rate = 2 × 1/6).

What is depreciation in year 5?$q$, $q$["$2,041.15", "$1,804.12", "$4,566.67", "$3,061.73", "$1,020.58"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $6,123.46. Year-5 depreciation = $2,041.15.$q$),
  ($q$g-ddb-06$q$, 1295, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $28,000, has a residual value of $7,200 and a 7-year life, depreciated by the declining-balance method (rate = 1/7).

What is depreciation in year 4?$q$, $q$["$2,518.95", "$1,871.22", "$2,971.43", "$2,938.78", "$5,037.90"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 4 = $17,632.65. Year-4 depreciation = $2,518.95.$q$),
  ($q$g-ddb-07$q$, 1296, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $39,000, has a residual value of $1,600 and a 4-year life, depreciated by the double-declining-balance method (rate = 2 × 1/4).

What is depreciation in year 3?$q$, $q$["$4,875.00", "$4,675.00", "$9,350.00", "$9,750.00", "$2,437.50"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 3 = $9,750.00. Year-3 depreciation = $4,875.00.$q$),
  ($q$g-ddb-08$q$, 1297, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $22,000, has a residual value of $2,900 and a 4-year life, depreciated by the double-declining-balance method (rate = 2 × 1/4).

What is depreciation in year 4?$q$, $q$["$0.00", "$1,375.00", "$1,193.75", "$4,775.00", "$2,600.00"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 4 = $2,900.00. The full rate would take book value below the residual, so depreciation stops at the residual. Year-4 depreciation = $0.00.$q$),
  ($q$g-ddb-09$q$, 1298, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $18,000, has a residual value of $4,600 and a 4-year life, depreciated by the double-declining-balance method (rate = 2 × 1/4).

What is depreciation in year 3?$q$, $q$["$0.00", "$2,250.00", "$1,675.00", "$3,350.00", "$4,400.00"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 3 = $4,600.00. The full rate would take book value below the residual, so depreciation stops at the residual. Year-3 depreciation = $0.00.$q$),
  ($q$g-ddb-10$q$, 1299, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $20,000, has a residual value of $2,700 and a 8-year life, depreciated by the double-declining-balance method (rate = 2 × 1/8).

What is depreciation in year 4?$q$, $q$["$2,109.38", "$1,824.61", "$2,162.50", "$2,812.50", "$1,054.69"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 4 = $8,437.50. Year-4 depreciation = $2,109.38.$q$),
  ($q$g-ddb-11$q$, 1300, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $36,000, has a residual value of $9,100 and a 5-year life, depreciated by the double-declining-balance method (rate = 2 × 1/5).

What is depreciation in year 2?$q$, $q$["$8,640.00", "$6,456.00", "$5,380.00", "$14,400.00", "$4,320.00"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 2 = $21,600.00. Year-2 depreciation = $8,640.00.$q$),
  ($q$g-ddb-12$q$, 1301, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $23,000, has a residual value of $2,200 and a 5-year life, depreciated by the declining-balance method (rate = 1/5).

What is depreciation in year 5?$q$, $q$["$1,884.16", "$1,703.94", "$4,160.00", "$2,355.20", "$3,768.32"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $9,420.80. Year-5 depreciation = $1,884.16.$q$),
  ($q$g-ddb-13$q$, 1302, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $21,000, has a residual value of $600 and a 4-year life, depreciated by the double-declining-balance method (rate = 2 × 1/4).

What is depreciation in year 5?$q$, $q$["$656.25", "$637.50", "$5,100.00", "$1,312.50", "$328.13"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $1,312.50. Year-5 depreciation = $656.25.$q$),
  ($q$g-ddb-14$q$, 1303, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $39,000, has a residual value of $7,700 and a 8-year life, depreciated by the double-declining-balance method (rate = 2 × 1/8).

What is depreciation in year 3?$q$, $q$["$5,484.38", "$4,401.56", "$3,912.50", "$7,312.50", "$2,742.19"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 3 = $21,937.50. Year-3 depreciation = $5,484.38.$q$),
  ($q$g-ddb-15$q$, 1304, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $27,000, has a residual value of $3,300 and a 8-year life, depreciated by the double-declining-balance method (rate = 2 × 1/8).

What is depreciation in year 5?$q$, $q$["$2,135.74", "$1,874.71", "$2,962.50", "$2,847.66", "$1,067.87"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $8,542.97. Year-5 depreciation = $2,135.74.$q$),
  ($q$g-ddb-16$q$, 1305, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $37,000, has a residual value of $5,500 and a 5-year life, depreciated by the declining-balance method (rate = 1/5).

What is depreciation in year 2?$q$, $q$["$5,920.00", "$5,040.00", "$6,300.00", "$7,400.00", "$11,840.00"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 2 = $29,600.00. Year-2 depreciation = $5,920.00.$q$),
  ($q$g-ddb-17$q$, 1306, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $37,000, has a residual value of $4,200 and a 4-year life, depreciated by the double-declining-balance method (rate = 2 × 1/4).

What is depreciation in year 2?$q$, $q$["$9,250.00", "$8,200.00", "$18,500.00", "$4,625.00", "$8,602.50"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 2 = $18,500.00. Year-2 depreciation = $9,250.00.$q$),
  ($q$g-ddb-18$q$, 1307, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $11,000, has a residual value of $1,700 and a 7-year life, depreciated by the declining-balance method (rate = 1/7).

What is depreciation in year 2?$q$, $q$["$1,346.94", "$1,138.78", "$1,328.57", "$1,571.43", "$2,693.88"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 2 = $9,428.57. Year-2 depreciation = $1,346.94.$q$),
  ($q$g-ddb-19$q$, 1308, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $29,000, has a residual value of $8,400 and a 5-year life, depreciated by the declining-balance method (rate = 1/5).

What is depreciation in year 5?$q$, $q$["$2,375.68", "$1,687.55", "$4,120.00", "$2,969.60", "$4,751.36"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $11,878.40. Year-5 depreciation = $2,375.68.$q$),
  ($q$g-ddb-20$q$, 1309, $q$Barry's Batting Cages$q$, $q$Declining balance$q$, $q$Equipment cost $16,000, has a residual value of $3,300 and a 7-year life, depreciated by the double-declining-balance method (rate = 2 × 1/7).

What is depreciation in year 5?$q$, $q$["$864.93", "$1,189.98", "$944.55", "$1,814.29", "$1,665.97"]$q$::jsonb, 0, $q$The rate is applied to book value, ignoring residual until the floor. Book value at the start of year 5 = $4,164.93. The full rate would take book value below the residual, so depreciation stops at the residual. Year-5 depreciation = $864.93.$q$),
  ($q$g-tradein-01$q$, 1310, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $6,700 (residual $600, life 1,000,000 balls, units of production). Before this year it had pitched 192,000 balls; this year it pitched 40,360 more before being traded in. The new machine's price is $6,800, with a trade-in allowance of $5,680 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $397; cash $1,120", "Gain $151; cash $1,120", "Loss $397; cash $1,120", "Gain $397; cash $6,800", "Loss $1,020; cash $1,120"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.006100 × 232,360 = $1,417, so book value = $5,283. Allowance $5,680 vs book value → gain of $397. Cash = $6,800 − $5,680 = $1,120. The new machine is recorded at $6,800.$q$),
  ($q$g-tradein-02$q$, 1311, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $5,100 (residual $700, life 800,000 balls, units of production). Before this year it had pitched 359,000 balls; this year it pitched 93,450 more before being traded in. The new machine's price is $7,400, with a trade-in allowance of $2,310 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $302; cash $5,090", "Loss $816; cash $5,090", "Gain $302; cash $5,090", "Loss $302; cash $7,400", "Loss $2,790; cash $5,090"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.005500 × 452,450 = $2,488, so book value = $2,612. Allowance $2,310 vs book value → loss of $302. Cash = $7,400 − $2,310 = $5,090. The new machine is recorded at $7,400.$q$),
  ($q$g-tradein-03$q$, 1312, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $8,200 (residual $400, life 800,000 balls, units of production). Before this year it had pitched 308,000 balls; this year it pitched 102,900 more before being traded in. The new machine's price is $7,000, with a trade-in allowance of $5,090 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $896; cash $1,910", "Loss $107; cash $1,910", "Loss $896; cash $1,910", "Gain $896; cash $7,000", "Loss $3,110; cash $1,910"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.009750 × 410,900 = $4,006, so book value = $4,194. Allowance $5,090 vs book value → gain of $896. Cash = $7,000 − $5,090 = $1,910. The new machine is recorded at $7,000.$q$),
  ($q$g-tradein-04$q$, 1313, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $7,300 (residual $200, life 1,000,000 balls, units of production). Before this year it had pitched 390,000 balls; this year it pitched 108,100 more before being traded in. The new machine's price is $9,400, with a trade-in allowance of $2,560 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $1,203; cash $6,840", "Loss $1,971; cash $6,840", "Gain $1,203; cash $6,840", "Loss $1,203; cash $9,400", "Loss $4,740; cash $6,840"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.007100 × 498,100 = $3,537, so book value = $3,763. Allowance $2,560 vs book value → loss of $1,203. Cash = $9,400 − $2,560 = $6,840. The new machine is recorded at $9,400.$q$),
  ($q$g-tradein-05$q$, 1314, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $4,600 (residual $700, life 1,000,000 balls, units of production). Before this year it had pitched 218,000 balls; this year it pitched 37,430 more before being traded in. The new machine's price is $8,400, with a trade-in allowance of $3,800 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $196; cash $4,600", "Gain $50; cash $4,600", "Loss $196; cash $4,600", "Gain $196; cash $8,400", "Loss $800; cash $4,600"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.003900 × 255,430 = $996, so book value = $3,604. Allowance $3,800 vs book value → gain of $196. Cash = $8,400 − $3,800 = $4,600. The new machine is recorded at $8,400.$q$),
  ($q$g-tradein-06$q$, 1315, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $6,500 (residual $600, life 800,000 balls, units of production). Before this year it had pitched 362,000 balls; this year it pitched 70,660 more before being traded in. The new machine's price is $7,700, with a trade-in allowance of $1,960 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $1,349; cash $5,740", "Loss $1,870; cash $5,740", "Gain $1,349; cash $5,740", "Loss $1,349; cash $7,700", "Loss $4,540; cash $5,740"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.007375 × 432,660 = $3,191, so book value = $3,309. Allowance $1,960 vs book value → loss of $1,349. Cash = $7,700 − $1,960 = $5,740. The new machine is recorded at $7,700.$q$),
  ($q$g-tradein-07$q$, 1316, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $5,900 (residual $400, life 1,000,000 balls, units of production). Before this year it had pitched 344,000 balls; this year it pitched 117,430 more before being traded in. The new machine's price is $6,900, with a trade-in allowance of $3,110 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $252; cash $3,790", "Loss $898; cash $3,790", "Gain $252; cash $3,790", "Loss $252; cash $6,900", "Loss $2,790; cash $3,790"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.005500 × 461,430 = $2,538, so book value = $3,362. Allowance $3,110 vs book value → loss of $252. Cash = $6,900 − $3,110 = $3,790. The new machine is recorded at $6,900.$q$),
  ($q$g-tradein-08$q$, 1317, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $5,900 (residual $100, life 800,000 balls, units of production). Before this year it had pitched 292,000 balls; this year it pitched 105,070 more before being traded in. The new machine's price is $8,600, with a trade-in allowance of $1,670 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $1,351; cash $6,930", "Loss $2,113; cash $6,930", "Gain $1,351; cash $6,930", "Loss $1,351; cash $8,600", "Loss $4,230; cash $6,930"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.007250 × 397,070 = $2,879, so book value = $3,021. Allowance $1,670 vs book value → loss of $1,351. Cash = $8,600 − $1,670 = $6,930. The new machine is recorded at $8,600.$q$),
  ($q$g-tradein-09$q$, 1318, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $6,600 (residual $300, life 800,000 balls, units of production). Before this year it had pitched 285,000 balls; this year it pitched 94,630 more before being traded in. The new machine's price is $8,100, with a trade-in allowance of $2,860 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $750; cash $5,240", "Loss $1,496; cash $5,240", "Gain $750; cash $5,240", "Loss $750; cash $8,100", "Loss $3,740; cash $5,240"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.007875 × 379,630 = $2,990, so book value = $3,610. Allowance $2,860 vs book value → loss of $750. Cash = $8,100 − $2,860 = $5,240. The new machine is recorded at $8,100.$q$),
  ($q$g-tradein-10$q$, 1319, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $5,100 (residual $300, life 800,000 balls, units of production). Before this year it had pitched 261,000 balls; this year it pitched 39,980 more before being traded in. The new machine's price is $7,700, with a trade-in allowance of $4,040 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $746; cash $3,660", "Gain $506; cash $3,660", "Loss $746; cash $3,660", "Gain $746; cash $7,700", "Loss $1,060; cash $3,660"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.006000 × 300,980 = $1,806, so book value = $3,294. Allowance $4,040 vs book value → gain of $746. Cash = $7,700 − $4,040 = $3,660. The new machine is recorded at $7,700.$q$),
  ($q$g-tradein-11$q$, 1320, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $6,700 (residual $600, life 800,000 balls, units of production). Before this year it had pitched 114,000 balls; this year it pitched 58,370 more before being traded in. The new machine's price is $8,500, with a trade-in allowance of $4,540 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $846; cash $3,960", "Loss $1,291; cash $3,960", "Gain $846; cash $3,960", "Loss $846; cash $8,500", "Loss $2,160; cash $3,960"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.007625 × 172,370 = $1,314, so book value = $5,386. Allowance $4,540 vs book value → loss of $846. Cash = $8,500 − $4,540 = $3,960. The new machine is recorded at $8,500.$q$),
  ($q$g-tradein-12$q$, 1321, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $7,500 (residual $500, life 800,000 balls, units of production). Before this year it had pitched 235,000 balls; this year it pitched 95,350 more before being traded in. The new machine's price is $6,100, with a trade-in allowance of $3,610 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $999; cash $2,490", "Loss $1,834; cash $2,490", "Gain $999; cash $2,490", "Loss $999; cash $6,100", "Loss $3,890; cash $2,490"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.008750 × 330,350 = $2,891, so book value = $4,609. Allowance $3,610 vs book value → loss of $999. Cash = $6,100 − $3,610 = $2,490. The new machine is recorded at $6,100.$q$),
  ($q$g-tradein-13$q$, 1322, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $6,300 (residual $200, life 1,000,000 balls, units of production). Before this year it had pitched 256,000 balls; this year it pitched 82,090 more before being traded in. The new machine's price is $9,000, with a trade-in allowance of $4,040 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $198; cash $4,960", "Loss $698; cash $4,960", "Gain $198; cash $4,960", "Loss $198; cash $9,000", "Loss $2,260; cash $4,960"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.006100 × 338,090 = $2,062, so book value = $4,238. Allowance $4,040 vs book value → loss of $198. Cash = $9,000 − $4,040 = $4,960. The new machine is recorded at $9,000.$q$),
  ($q$g-tradein-14$q$, 1323, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $5,100 (residual $100, life 1,000,000 balls, units of production). Before this year it had pitched 174,000 balls; this year it pitched 112,860 more before being traded in. The new machine's price is $6,800, with a trade-in allowance of $4,770 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $1,104; cash $2,030", "Gain $540; cash $2,030", "Loss $1,104; cash $2,030", "Gain $1,104; cash $6,800", "Loss $330; cash $2,030"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.005000 × 286,860 = $1,434, so book value = $3,666. Allowance $4,770 vs book value → gain of $1,104. Cash = $6,800 − $4,770 = $2,030. The new machine is recorded at $6,800.$q$),
  ($q$g-tradein-15$q$, 1324, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $4,700 (residual $100, life 800,000 balls, units of production). Before this year it had pitched 172,000 balls; this year it pitched 103,380 more before being traded in. The new machine's price is $8,600, with a trade-in allowance of $1,670 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $1,447; cash $6,930", "Loss $2,041; cash $6,930", "Gain $1,447; cash $6,930", "Loss $1,447; cash $8,600", "Loss $3,030; cash $6,930"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.005750 × 275,380 = $1,583, so book value = $3,117. Allowance $1,670 vs book value → loss of $1,447. Cash = $8,600 − $1,670 = $6,930. The new machine is recorded at $8,600.$q$),
  ($q$g-tradein-16$q$, 1325, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $8,000 (residual $600, life 1,000,000 balls, units of production). Before this year it had pitched 107,000 balls; this year it pitched 105,930 more before being traded in. The new machine's price is $7,200, with a trade-in allowance of $7,070 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $646; cash $130", "Loss $138; cash $130", "Loss $646; cash $130", "Gain $646; cash $7,200", "Loss $930; cash $130"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.007400 × 212,930 = $1,576, so book value = $6,424. Allowance $7,070 vs book value → gain of $646. Cash = $7,200 − $7,070 = $130. The new machine is recorded at $7,200.$q$),
  ($q$g-tradein-17$q$, 1326, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $4,900 (residual $500, life 1,000,000 balls, units of production). Before this year it had pitched 115,000 balls; this year it pitched 93,150 more before being traded in. The new machine's price is $7,900, with a trade-in allowance of $2,680 and the rest paid in cash.

What is the loss on the trade, and how much cash is paid?$q$, $q$["Loss $1,304; cash $5,220", "Loss $1,714; cash $5,220", "Gain $1,304; cash $5,220", "Loss $1,304; cash $7,900", "Loss $2,220; cash $5,220"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.004400 × 208,150 = $916, so book value = $3,984. Allowance $2,680 vs book value → loss of $1,304. Cash = $7,900 − $2,680 = $5,220. The new machine is recorded at $7,900.$q$),
  ($q$g-tradein-18$q$, 1327, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $6,800 (residual $600, life 1,000,000 balls, units of production). Before this year it had pitched 395,000 balls; this year it pitched 87,320 more before being traded in. The new machine's price is $8,400, with a trade-in allowance of $4,010 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $200; cash $4,390", "Loss $341; cash $4,390", "Loss $200; cash $4,390", "Gain $200; cash $8,400", "Loss $2,790; cash $4,390"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.006200 × 482,320 = $2,990, so book value = $3,810. Allowance $4,010 vs book value → gain of $200. Cash = $8,400 − $4,010 = $4,390. The new machine is recorded at $8,400.$q$),
  ($q$g-tradein-19$q$, 1328, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $4,000 (residual $700, life 800,000 balls, units of production). Before this year it had pitched 230,000 balls; this year it pitched 44,580 more before being traded in. The new machine's price is $6,600, with a trade-in allowance of $4,070 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $1,203; cash $2,530", "Gain $1,019; cash $2,530", "Loss $1,203; cash $2,530", "Gain $1,203; cash $6,600", "Gain $70; cash $2,530"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.004125 × 274,580 = $1,133, so book value = $2,867. Allowance $4,070 vs book value → gain of $1,203. Cash = $6,600 − $4,070 = $2,530. The new machine is recorded at $6,600.$q$),
  ($q$g-tradein-20$q$, 1329, $q$Barry's Batting Cages$q$, $q$Trade-ins$q$, $q$A machine cost $5,300 (residual $0, life 800,000 balls, units of production). Before this year it had pitched 277,000 balls; this year it pitched 35,390 more before being traded in. The new machine's price is $9,700, with a trade-in allowance of $3,680 and the rest paid in cash.

What is the gain on the trade, and how much cash is paid?$q$, $q$["Gain $450; cash $6,020", "Gain $215; cash $6,020", "Loss $450; cash $6,020", "Gain $450; cash $9,700", "Loss $1,620; cash $6,020"]$q$::jsonb, 0, $q$Depreciate up to the trade-in date first: accumulated depreciation = $0.006625 × 312,390 = $2,070, so book value = $3,230. Allowance $3,680 vs book value → gain of $450. Cash = $9,700 − $3,680 = $6,020. The new machine is recorded at $9,700.$q$),
  ($q$g-impair-01$q$, 1330, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $13,000 (residual $900, 7-year life) and is depreciated straight-line. At the end of year 2, its recoverable amount is $5,400.

What is the impairment loss, and how is it recorded?$q$, $q$["$4,143: DR Impairment Loss, CR Accumulated Depreciation", "$4,143: DR Accumulated Depreciation, CR Impairment Loss", "$7,600: DR Impairment Loss, CR Accumulated Depreciation", "$4,143: DR Impairment Loss, CR Retained Earnings", "$3,243: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 2 years = $9,542.86. Recoverable $5,400 is lower, so impairment = $4,142.86: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-02$q$, 1331, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $24,000 (residual $1,100, 6-year life) and is depreciated double-declining-balance. At the end of year 3, its recoverable amount is $6,100.

What is the impairment loss, and how is it recorded?$q$, $q$["$1,011: DR Impairment Loss, CR Accumulated Depreciation", "$1,011: DR Accumulated Depreciation, CR Impairment Loss", "$17,900: DR Impairment Loss, CR Accumulated Depreciation", "$1,011: DR Impairment Loss, CR Retained Earnings", "−$89: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 3 years = $7,111.11. Recoverable $6,100 is lower, so impairment = $1,011.11: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-03$q$, 1332, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $21,000 (residual $2,300, 6-year life) and is depreciated double-declining-balance. At the end of year 3, its recoverable amount is $4,200.

What is the impairment loss, and how is it recorded?$q$, $q$["$2,022: DR Impairment Loss, CR Accumulated Depreciation", "$2,022: DR Accumulated Depreciation, CR Impairment Loss", "$16,800: DR Impairment Loss, CR Accumulated Depreciation", "$2,022: DR Impairment Loss, CR Retained Earnings", "−$278: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 3 years = $6,222.22. Recoverable $4,200 is lower, so impairment = $2,022.22: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-04$q$, 1333, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $29,000 (residual $2,500, 6-year life) and is depreciated straight-line. At the end of year 4, its recoverable amount is $8,400.

What is the impairment loss, and how is it recorded?$q$, $q$["$2,933: DR Impairment Loss, CR Accumulated Depreciation", "$2,933: DR Accumulated Depreciation, CR Impairment Loss", "$20,600: DR Impairment Loss, CR Accumulated Depreciation", "$2,933: DR Impairment Loss, CR Retained Earnings", "$433: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 4 years = $11,333.33. Recoverable $8,400 is lower, so impairment = $2,933.33: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-05$q$, 1334, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $31,000 (residual $700, 7-year life) and is depreciated double-declining-balance. At the end of year 4, its recoverable amount is $5,600.

What is the impairment loss, and how is it recorded?$q$, $q$["$2,470: DR Impairment Loss, CR Accumulated Depreciation", "$2,470: DR Accumulated Depreciation, CR Impairment Loss", "$25,400: DR Impairment Loss, CR Accumulated Depreciation", "$2,470: DR Impairment Loss, CR Retained Earnings", "$1,770: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 4 years = $8,069.55. Recoverable $5,600 is lower, so impairment = $2,469.55: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-06$q$, 1335, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $27,000 (residual $800, 8-year life) and is depreciated straight-line. At the end of year 4, its recoverable amount is $8,700.

What is the impairment loss, and how is it recorded?$q$, $q$["$5,200: DR Impairment Loss, CR Accumulated Depreciation", "$5,200: DR Accumulated Depreciation, CR Impairment Loss", "$18,300: DR Impairment Loss, CR Accumulated Depreciation", "$5,200: DR Impairment Loss, CR Retained Earnings", "$4,400: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 4 years = $13,900.00. Recoverable $8,700 is lower, so impairment = $5,200.00: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-07$q$, 1336, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $20,000 (residual $2,200, 6-year life) and is depreciated double-declining-balance. At the end of year 3, its recoverable amount is $3,100.

What is the impairment loss, and how is it recorded?$q$, $q$["$2,826: DR Impairment Loss, CR Accumulated Depreciation", "$2,826: DR Accumulated Depreciation, CR Impairment Loss", "$16,900: DR Impairment Loss, CR Accumulated Depreciation", "$2,826: DR Impairment Loss, CR Retained Earnings", "$626: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 3 years = $5,925.93. Recoverable $3,100 is lower, so impairment = $2,825.93: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-08$q$, 1337, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $14,000 (residual $2,500, 5-year life) and is depreciated straight-line. At the end of year 4, its recoverable amount is $3,000.

What is the impairment loss, and how is it recorded?$q$, $q$["$1,800: DR Impairment Loss, CR Accumulated Depreciation", "$1,800: DR Accumulated Depreciation, CR Impairment Loss", "$11,000: DR Impairment Loss, CR Accumulated Depreciation", "$1,800: DR Impairment Loss, CR Retained Earnings", "−$700: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 4 years = $4,800.00. Recoverable $3,000 is lower, so impairment = $1,800.00: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-09$q$, 1338, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $20,000 (residual $2,100, 6-year life) and is depreciated straight-line. At the end of year 3, its recoverable amount is $9,500.

What is the impairment loss, and how is it recorded?$q$, $q$["$1,550: DR Impairment Loss, CR Accumulated Depreciation", "$1,550: DR Accumulated Depreciation, CR Impairment Loss", "$10,500: DR Impairment Loss, CR Accumulated Depreciation", "$1,550: DR Impairment Loss, CR Retained Earnings", "−$550: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 3 years = $11,050.00. Recoverable $9,500 is lower, so impairment = $1,550.00: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$),
  ($q$g-impair-10$q$, 1339, $q$Barry's Batting Cages$q$, $q$Impairment$q$, $q$An asset cost $27,000 (residual $2,300, 8-year life) and is depreciated double-declining-balance. At the end of year 4, its recoverable amount is $6,600.

What is the impairment loss, and how is it recorded?$q$, $q$["$1,943: DR Impairment Loss, CR Accumulated Depreciation", "$1,943: DR Accumulated Depreciation, CR Impairment Loss", "$20,400: DR Impairment Loss, CR Accumulated Depreciation", "$1,943: DR Impairment Loss, CR Retained Earnings", "−$357: DR Impairment Loss, CR Accumulated Depreciation"]$q$::jsonb, 0, $q$Carrying amount after 4 years = $8,542.97. Recoverable $6,600 is lower, so impairment = $1,942.97: DR Impairment Loss, CR Accumulated Depreciation (the plug).$q$);
