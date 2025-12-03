const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
    console.log('🚀 Iniciando Teste do Fluxo ZaptFood...\n');

    // 1. Registrar Vendedor
    console.log('1️⃣  Registrando Vendedor...');
    const vendorPayload = {
        name: "Churrascaria do Teste",
        phone: "5511999998888",
        pix_key: "test@pix.com"
    };

    let vendorId;

    try {
        // Tenta registrar
        let res = await fetch(`${BASE_URL}/api/vendors/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendorPayload)
        });
        let data = await res.json();

        if (res.status === 400 && data.error && data.error.includes('unique constraint')) {
            console.log('   ⚠️  Vendedor já existe, buscando ID...');
            // Se já existe, precisamos buscar o ID (vamos usar o check endpoint ou admin list para simplificar)
            // Usando o endpoint de check que criamos para o n8n
            res = await fetch(`${BASE_URL}/api/vendors/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: vendorPayload.phone })
            });
            data = await res.json();

            // Se ainda der erro (ex: não aprovado), tenta aprovar via admin
            if (res.status === 403) {
                // Pega o ID da lista de admin
                const adminRes = await fetch(`${BASE_URL}/api/admin/vendors`);
                const adminData = await adminRes.json();
                const vendor = adminData.find(v => v.phone === vendorPayload.phone);
                if (vendor) {
                    vendorId = vendor.id;
                    // Aprovar
                    await fetch(`${BASE_URL}/api/admin/vendors/${vendorId}/approve`, { method: 'POST' });
                    console.log('   ✅ Vendedor aprovado manualmente.');
                }
            } else {
                vendorId = data.id;
            }
        } else {
            vendorId = data.data[0].id;
            // Aprovar imediatamente para teste
            await fetch(`${BASE_URL}/api/admin/vendors/${vendorId}/approve`, { method: 'POST' });
            console.log('   ✅ Vendedor registrado e aprovado.');
        }

        if (!vendorId) {
            // Fallback: buscar na lista de admin se o check falhou por algum motivo
            const adminRes = await fetch(`${BASE_URL}/api/admin/vendors`);
            const adminData = await adminRes.json();
            const vendor = adminData.find(v => v.phone === vendorPayload.phone);
            if (vendor) vendorId = vendor.id;
        }

        console.log(`   🆔 Vendor ID: ${vendorId}\n`);

        if (!vendorId) throw new Error("Não foi possível obter o ID do vendedor.");

        // 2. Lançar Rodada (Fornada)
        console.log('2️⃣  Lançando Rodada (10 frangos)...');
        const listingPayload = {
            vendor_id: vendorId,
            qty: 10,
            price: 45.00,
            ttl_minutes: 60
        };

        res = await fetch(`${BASE_URL}/api/listings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listingPayload)
        });
        data = await res.json();
        console.log('   📦 Resposta:', JSON.stringify(data, null, 2));
        console.log('   ✅ Rodada lançada.\n');

        // 3. Consultar Catálogo
        console.log('3️⃣  Consultando Catálogo (Cliente)...');
        res = await fetch(`${BASE_URL}/api/listings`);
        data = await res.json();
        console.log(`   📋 Itens disponíveis: ${data.length}`);
        const myItem = data.find(i => i.vendor === vendorPayload.name);
        if (myItem) {
            console.log(`   🍗 Encontrado: ${myItem.product} por R$ ${myItem.price} (${myItem.qty} un)`);
        } else {
            console.log('   ❌ Item não encontrado no catálogo.');
        }
        console.log('\n');

        // 4. Decrementar Estoque (Venda Balcão)
        console.log('4️⃣  Simulando Venda Balcão (-2 unidades)...');
        res = await fetch(`${BASE_URL}/api/listings/decrement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vendor_id: vendorId, amount: 2 })
        });
        data = await res.json();
        console.log('   📉 Novo estoque:', data.new_qty);
        console.log('\n');

        // 5. Verificar Catálogo Novamente
        console.log('5️⃣  Verificando Catálogo Atualizado...');
        res = await fetch(`${BASE_URL}/api/listings`);
        data = await res.json();
        const updatedItem = data.find(i => i.vendor === vendorPayload.name);
        if (updatedItem) {
            console.log(`   🍗 Estoque atual no app: ${updatedItem.qty}`);
            if (updatedItem.qty === 8) console.log('   ✅ Teste de decremento SUCESSO!');
            else console.log('   ⚠️  Estoque incorreto.');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

runTest();
