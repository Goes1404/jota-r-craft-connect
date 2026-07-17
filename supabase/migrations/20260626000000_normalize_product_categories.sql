-- Normaliza categorias existentes: remove espaços das pontas, colapsa espaços
-- internos e capitaliza a primeira letra. Funde duplicatas como "Mouse " / "Mouse".
UPDATE public.products
SET category = upper(left(regexp_replace(trim(category), '\s+', ' ', 'g'), 1))
             || substr(regexp_replace(trim(category), '\s+', ' ', 'g'), 2)
WHERE category IS NOT NULL
  AND category <> upper(left(regexp_replace(trim(category), '\s+', ' ', 'g'), 1))
               || substr(regexp_replace(trim(category), '\s+', ' ', 'g'), 2);
