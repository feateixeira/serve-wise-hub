-- Add sample customer groups
INSERT INTO public.customer_groups (name, description, discount_percentage, discount_amount, establishment_id, active) 
SELECT 'VIP', 'Clientes muito importantes - 10% de desconto', 10, 0, p.establishment_id, true
FROM public.profiles p
WHERE p.establishment_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.customer_groups (name, description, discount_percentage, discount_amount, establishment_id, active) 
SELECT 'Frequente', 'Clientes que compram regularmente - 5% de desconto', 5, 0, p.establishment_id, true
FROM public.profiles p
WHERE p.establishment_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.customer_groups (name, description, discount_percentage, discount_amount, establishment_id, active) 
SELECT 'Primeira Compra', 'Desconto especial para primeira compra - R$ 5,00', 0, 5.00, p.establishment_id, true
FROM public.profiles p
WHERE p.establishment_id IS NOT NULL
ON CONFLICT DO NOTHING;
