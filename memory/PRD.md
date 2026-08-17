# PRD — Site do Corretor de Imóveis

## Problem statement
"Crie um site para um corretor de imóveis para que ele possa colocar pelo menos 1 foto do imóvel junto com valor e localidade."

## User choices
- Auth simples (JWT email/senha)
- URL de imagem colada manualmente
- Campos básicos: foto, valor, localidade, título/descrição, tipo (venda/aluguel)
- Estilo: elegante e sofisticado (Luxury Editorial)
- Contato WhatsApp/telefone por imóvel

## Personas
- **Corretor (admin)**: gerencia catálogo de imóveis via painel privado.
- **Visitante/Cliente**: navega o site público, vê fotos, valor, localidade; entra em contato via WhatsApp.

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT Bearer auth. Admin seed via .env.
- Frontend: React (CRA/craco), Tailwind, Shadcn UI, React Router, sonner toasts.
- Fonts: Playfair Display (serif) + Manrope (sans).

## Implemented (Feb/2026)
- [x] Endpoints públicos: GET /api/broker, GET /api/properties, GET /api/properties/{id}
- [x] Endpoints protegidos: POST/PUT/DELETE /api/properties
- [x] Auth: POST /api/auth/login, GET /api/auth/me
- [x] Seed idempotente do admin + 4 imóveis de exemplo
- [x] Home page pública: hero, grid de imóveis, sobre o corretor, footer
- [x] Dialog de detalhes do imóvel com botão WhatsApp + ligar
- [x] Login page do corretor
- [x] Painel admin: tabela + CRUD via dialog + confirmação de exclusão
- [x] Design "Luxury Editorial" (bone, ink, clay accents)

## Backlog (P1)
- Upload direto de fotos (múltiplas) via object storage
- Filtro de busca por cidade/tipo
- Slug SEO por imóvel + página dedicada
- Formulário de contato com envio de e-mail (Resend)
- Mais campos (área, quartos, banheiros, vagas)

## Backlog (P2)
- Analytics de visualizações por imóvel
- Compartilhamento no Instagram/Meta
- Reset de senha por e-mail
