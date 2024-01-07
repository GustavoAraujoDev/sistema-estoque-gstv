function LogoOut() {
    window.location.href = 'login.html'
}

const userName = localStorage.getItem('userName');
document.getElementById('welcomeUsername').textContent = userName;

const firebaseConfig = {
  apiKey: "AIzaSyAJ5bKMlhE_Yz9zonThHU3jg2giNL2b1uU",
  authDomain: "estoques-17fa6.firebaseapp.com",
  databaseURL: "https://estoques-17fa6-default-rtdb.firebaseio.com",
  projectId: "estoques-17fa6",
  storageBucket: "estoques-17fa6.appspot.com",
  messagingSenderId: "41969651629",
  appId: "1:41969651629:web:ec4922b09c76f8af5cdb24"
};

firebase.initializeApp(firebaseConfig);

var database = firebase.database();

var estadoDiaSalvo = sessionStorage.getItem('estadoDia');
var isDiaAberto = estadoDiaSalvo ? JSON.parse(estadoDiaSalvo) : false;

function atualizarEstadoDiaFirebase(novoEstado) {
    database.ref('estadoDia').set(novoEstado);
    atualizarTabela();
    atualizarInterfaceDia();
}

window.addEventListener("beforeunload", function() {
    sessionStorage.setItem('estadoDiaBeforeUnload', JSON.stringify(isDiaAberto));
});

window.addEventListener("load", function() {
    var estadoDiaBeforeUnload = sessionStorage.getItem('estadoDiaBeforeUnload');
    if (estadoDiaBeforeUnload) {
        isDiaAberto = JSON.parse(estadoDiaBeforeUnload);
        atualizarInterfaceDia();
    }
});

var isDiaAberto = false;
var totalProdutosEstoque = 0;
var valorTotalEstoque = 0;
var totalProdutosDiaAnterior = 0;
var valorTotalEstoqueDiaAnterior = 0;
var entradasProdutos = 0;
var produtosBaixos = [];
var produtosAltos = [];

function abrirDia() {
    var confirmacao = confirm('Tem certeza que deseja abrir o dia?');

    if (confirmacao) {
    document.getElementById('btnAbrirDia').style.display = 'none';
    document.getElementById('btnFecharDia').style.display = '';
    document.getElementById('btnFecharDia').disabled = false;
    document.getElementById('btnFecharDia').style.backgroundColor = '';
    totalProdutosDiaAnterior = totalProdutosEstoque;
    valorTotalEstoqueDiaAnterior = valorTotalEstoque;
    isDiaAberto = true;
    limparTabelaFimDia();
    atualizarTabelaInicioComFim();
    removerDuplicatasTabelaFim();
    restaurarDadosTabelaFimLocal();
    exibirNotificacao('Dia Aberto', 'Boas Vendas e Bom Trabalho')
    database.ref('estadoDia').set(true);
    atualizarEstadoDiaFirebase(true);
} else {
    console.log('Abrimento do dia cancelado.');
}
}

function fecharDia() {
    var confirmacao = confirm('Tem certeza que deseja fechar o dia?');

    if (confirmacao) {
        document.getElementById('btnAbrirDia').style.display = '';
        document.getElementById('btnFecharDia').style.display = 'none';
        document.getElementById('btnAbrirDia').disabled = false;
        document.getElementById('btnAbrirDia').style.backgroundColor = '';
        isDiaAberto = false;
        limparTabelaFimDia();
        atualizarTabelaFimComInicio();
        removerDuplicatasTabelaFim();
        salvarDadosTabelaFimLocal();
        restaurarDadosTabelaFimLocal();
        exibirNotificacao('Dia Fechado', 'Bom descanço');
        database.ref('estadoDia').set(false);
        atualizarEstadoDiaFirebase(false);
        historicoMovimentacao = [];
    } else {
        console.log('Fechamento do dia cancelado.');
    }
}

database.ref('estadoDia').on('value', function(snapshot) {
    var estadoDiaFirebase = snapshot.val();
    isDiaAberto = estadoDiaFirebase !== null ? estadoDiaFirebase : false;
    atualizarInterfaceDia();
});

// Adicionar um produto à lista
function addProductToList() {
    var productName = document.getElementById('productName').value;
    var productQuantity = document.getElementById('productQuantity').value;
    // Validar entradas
    if (productName !== '' && productQuantity !== '') {
        // Obter a tabela de início do dia
        var tabelaInicioDia = document.getElementById('tabelaInicioDia');
        // Verificar se o produto já está na tabela
        var produtoNaTabela = checkIfProductInTable(productName, productQuantity);
        if (!produtoNaTabela) {
            var confirmAdd = confirm('O produto não está na tabela. Deseja adicioná-lo à lista?');
            if (!confirmAdd) {
                return;
            }
        }
        // Adicionar o produto à lista
        addProductToTableView(productName, productQuantity);
        // Salvar dados no Firebase
        saveProductToFirebase(productName, productQuantity);
        // Limpar os campos de entrada
        document.getElementById('productName').value = '';
        document.getElementById('productQuantity').value = '';
    } else {
        alert('Preencha todos os campos.');
    }
}


function checkIfProductInTable(productName, productQuantity) {
    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    var rows = tabelaInicioDia.rows;

    for (var i = 1; i < rows.length; i++) {
        var cells = rows[i].cells;
        var nomeProdutoNaTabela = cells[0].textContent.trim();

        if (nomeProdutoNaTabela === productName) {
            // Obter a quantidade na tabela
            var quantidadeNaTabela = parseInt(cells[1].textContent);

            // Comparar com a quantidade na lista
            if (quantidadeNaTabela < parseInt(productQuantity)) {
            }
        }
    }
}

function saveProductToFirebase(productName, productQuantity) {
    // Obter uma referência para o nó "products" no banco de dados
    var productsRef = database.ref('products');

    // Adicionar um novo produto ao banco de dados
    productsRef.push({
        nome: productName,
        quantidade: productQuantity
    });
}

window.onload = function() {
    // Carregue os dados do Firebase e construa a lista
    loadProductsFromFirebase();
};

function loadProductsFromFirebase() {
    // Obter uma referência para o nó "products" no banco de dados
    var productsRef = database.ref('products');

    // Limpar a lista antes de carregar novamente para evitar duplicatas
    var productList = document.getElementById('productList');
    productList.innerHTML = '';

    // Carregar dados do Firebase
    productsRef.once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var productData = childSnapshot.val();
            var productName = productData.nome;
            var productQuantity = productData.quantidade;

            // Adicionar o produto à lista
            addProductToTableView(productName, productQuantity, childSnapshot.key);
        
        });
    });
}

function compararalert() {
    // Assuming both tables have rows with corresponding data
var tabelaInicioDiaRows = document.getElementById("tabelaInicioDia").rows;
var productListRows = document.getElementById("productList").rows;

// Iterate through rows to compare quantities
for (var i = 1; i < tabelaInicioDiaRows.length; i++) {
    var produtoInicioDia = tabelaInicioDiaRows[i].cells[0].innerText;  // Assuming the product name is in the first cell
    var quantidadeInicioDia = parseInt(tabelaInicioDiaRows[i].cells[1].innerText);  // Assuming the quantity is in the second cell

    // Find corresponding product in productList
    var productListRow = Array.from(productListRows).find(row => row.cells[0].innerText === produtoInicioDia);

    if (productListRow) {
        var quantidadeProductList = parseInt(productListRow.cells[1].innerText);  // Assuming the quantity is in the second cell

        // Compare quantities and show alert if needed
        if (quantidadeInicioDia < quantidadeProductList) {
          exibirNotificacao('Alerta de Estoque baixo', 'Estoque Baixo em ' + produtoInicioDia + ' ' + quantidadeInicioDia + ' Unidades')
        }
    }
  }
}

function addProductToTableView(productName, productQuantity, productId) {
    // Adicionar o produto à tabela
    var table = document.getElementById('productList');

    // Criar uma nova linha na tabela
    var row = table.insertRow();

    // Adicionar células à linha
    var cellName = row.insertCell(0);
    var cellQuantity = row.insertCell(1);
    var cellDelete = row.insertCell(2);

    // Preencher as células com os dados do produto
    cellName.textContent = productName;
    cellQuantity.textContent = productQuantity;

    // Adicionar botão de exclusão
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Excluir';
    deleteButton.onclick = function() {
        deleteProductFromFirebase(productId);
        // Remove a linha da tabela ao excluir o produto
        table.deleteRow(row.rowIndex);
    };

    // Adicionar botão de exclusão à célula correspondente
    cellDelete.appendChild(deleteButton);
}

function deleteProductFromFirebase(productId) {
    // Obter uma referência para o nó "products" e o produto específico a ser excluído
    var productsRef = database.ref('products').child(productId);

    // Remover o produto do Firebase
    productsRef.remove().then(function() {
        // Recarregar a tabela após a exclusão
        loadTableFromFirebase();
    }).catch(function(error) {
        console.error('Erro ao excluir produto:', error);
    });
}

function clearTable() {
    // Limpar a tabela antes de recarregar os dados do Firebase
    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    tabelaInicioDia.innerHTML = '';

    // Adicionar cabeçalho à tabela
    var header = tabelaInicioDia.createTHead();
    var row = header.insertRow(0);
    row.insertCell(0).textContent = 'Produto';
    row.insertCell(1).textContent = 'Quantidade';
}

function loadTableFromFirebase() {
    // Obter uma referência para o nó "products" no banco de dados
    var productsRef = database.ref('products');

    // Carregar dados do Firebase
    productsRef.once('value').then(function(snapshot) {
        // Limpar a tabela antes de adicionar os dados
        clearTable();

        snapshot.forEach(function(childSnapshot) {
            var productData = childSnapshot.val();
            var productName = productData.nome;
            var productQuantity = productData.quantidade;

            // Adicionar o produto à tabela
            addToTable(productName, productQuantity);
        });
    });
}

function addToTable(productName, productQuantity) {
    // Adicionar o produto à tabela
    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    var row = tabelaInicioDia.insertRow(-1);
    row.insertCell(0).textContent = productName;
    row.insertCell(1).textContent = productQuantity;
}

function exibirNotificacao(titulo, mensagem) {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
        // Solicitar permissão para exibir notificações
        Notification.requestPermission().then(function (permission) {
            if (permission === 'granted') {
                // Criar e exibir a notificação
                var notificacao = new Notification(titulo, { 
                    body: mensagem, 
                    icon: 'logogustavodev.jpg'
                });
            }
        });
    }
}

function openProductModal() {
    var modal = document.getElementById('productModal');
    modal.style.display = 'block';
}

// Close the product modal
function closeProductModal() {
    var modal = document.getElementById('productModal');
    modal.style.display = 'none';
}

function closemodalfinalizado() {
    var modal = document.getElementById('modalfinalizado');
    modal.style.display = 'none';
}

function fecharestimativa() {
    var modal = document.getElementById('myModalestimativa');
    modal.style.display = 'none';
}

function atualizarInterfaceDia() {
    var btnAbrirDia = document.getElementById('btnAbrirDia');
    var btnFecharDia = document.getElementById('btnFecharDia');
    
    btnAbrirDia.style.display = isDiaAberto ? 'none' : '';
    btnFecharDia.style.display = isDiaAberto ? '' : 'none';
    btnFecharDia.disabled = isDiaAberto ? false : true;
    btnFecharDia.style.backgroundColor = isDiaAberto ? '' : '#dddddd';

    // Sempre mostra ambas as tabelas, independentemente do estado do dia
    document.getElementById('tabelaInicioDia').style.display = 'table';
    document.getElementById('tabelaFimDia').style.display = 'table';
}

function adicionarProduto() {
    var nome = prompt("Digite o nome do produto:");
    var quantidade = parseInt(prompt("Digite a quantidade do produto:"));
    var preco = parseFloat(prompt("Digite o preço do produto:"));

    var produtoExistente = false;
    var produtoKey = null;

    database.ref('produtos').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var produto = childSnapshot.val();
            if (produto.nome === nome) {
                produtoExistente = true;
                produtoKey = childSnapshot.key;
                quantidade += produto.quantidade;
            }
        });

        if (produtoExistente) {
            // Verifica se a nova quantidade é maior que zero
            if (quantidade > 0) {
                database.ref('produtos/' + produtoKey).update({
                    quantidade: quantidade,
                    preco: preco
                });
            } else {
                // Se a quantidade é 0, remove o produto
                database.ref('produtos/' + produtoKey).remove();
            }
        } else {
            // Adiciona o produto apenas se a quantidade for maior que zero
            if (quantidade > 0) {
                database.ref('produtos').push({
                    nome: nome,
                    quantidade: quantidade,
                    preco: preco
                });
                exibirNotificacao('Novo Produto Na Tabela', 'Um Novo Produto ' + nome + ' '+ quantidade + 'Unidade')           
            }
        }

        atualizarTabelaInicioDia();
        adicionarMovimentacao(nome, quantidade, 'entrada');
        // Atualiza as variáveis de rastreamento
        totalProdutosEstoque += quantidade;
        valorTotalEstoque += quantidade * preco;
        entradasProdutos += quantidade;
        // Verifica e adiciona à lista de produtos baixos ou altos
        if (quantidade <= 5) {
            produtosBaixos.push(nome);
        } else if (quantidade >= 20) {
            produtosAltos.push(nome);
        }
    });
    // Chamar a função para garantir nomes únicos após adicionar um produto
    
}

function atualizarQuantidadeInicioDia(key) {
    if (isDiaAberto) {
        var novaQuantidade = parseInt(prompt("Digite a nova quantidade:"));

        if (!isNaN(novaQuantidade)) {
            database.ref('produtos/' + key).once('value').then(function(snapshot) {
                var produto = snapshot.val();
                var quantidadeAntiga = produto.quantidade; 

                database.ref('produtos/' + key).update({
                    quantidade: novaQuantidade,
                    preco: produto.preco
                });
                checkIfProductInTable(produto.nome, novaQuantidade);
                var diferencaQuantidade = novaQuantidade - quantidadeAntiga;
                if(novaQuantidade > quantidadeAntiga){
                    adicionarMovimentacao(produto.nome, diferencaQuantidade, 'entrada');
                }else{
                    adicionarMovimentacao(produto.nome, diferencaQuantidade, 'saida');
                }
                atualizarTabelaInicioDia();
                exibirNotificacao('Produto Alterado', 'um produto foi atualizado ' + produto.nome + ' ' + novaQuantidade + ' Unidade');
                
            });
        } else {
            alert("Por favor, digite um valor válido para a nova quantidade.");
        }
    } else {
        alert("O dia está fechado. Não é possível atualizar a quantidade do produto.");
    }
}

function removerProdutoInicioDia(key) {
    if (isDiaAberto) {
        var confirmAdd = confirm('Deseja excluir da tabela?');

        if (confirmAdd) {
            database.ref('produtos/' + key).remove();
            atualizarTabelaInicioDia();
            exibirNotificacao('Produto Removido', 'Um produto Foi Excluido Da Tabela')
        }
        
    } else {
        alert("O dia está fechado. Não é possível remover produtos.");
    }
}

function atualizarTabela() {
     var tabelaInicioDia = document.getElementById("tabelaInicioDia");
    var tabelaFimDia = document.getElementById("tabelaFimDia");
    var totalProdutos = 0;
    var dadosTabelaFim = sessionStorage.getItem('dadosTabelaFim');
    // Limpa a lista de nomes únicos
    nomesUnicos = [];

    // Remove as linhas existentes nas tabelas de início e fim do dia
    while (tabelaInicioDia.rows.length > 1) {
        tabelaInicioDia.deleteRow(1);
    }

    // Remove as linhas existentes na tabela de fim do dia (se o dia estiver fechado)
    if (!isDiaAberto) {
        while (tabelaFimDia.rows.length > 1) {
            tabelaFimDia.deleteRow(1);
        }
    }

    if (dadosTabelaFim) {
        dadosTabelaFim = JSON.parse(dadosTabelaFim);

        // Adiciona os dados da tabela fim à tabela
        dadosTabelaFim.forEach(function (dados) {
            var rowFimDia = tabelaFimDia.insertRow(-1);
            var cell1FimDia = rowFimDia.insertCell(0);
            var cell2FimDia = rowFimDia.insertCell(1);
            var cell3FimDia = rowFimDia.insertCell(2);

            cell1FimDia.innerHTML = dados.produto;
            cell2FimDia.innerHTML = dados.quantidade;
            cell3FimDia.innerHTML = dados.preco;
        });
    }

    database.ref('produtos').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var produto = childSnapshot.val();

            // Adiciona o nome à lista se ainda não existir
            if (nomesUnicos.indexOf(produto.nome) === -1) {
                nomesUnicos.push(produto.nome);

                // Adiciona a linha na tabela de início do dia
                var rowInicioDia = tabelaInicioDia.insertRow(-1);
                var cell1InicioDia = rowInicioDia.insertCell(0);
                var cell2InicioDia = rowInicioDia.insertCell(1);
                var cell3InicioDia = rowInicioDia.insertCell(2);
                var cell4InicioDia = rowInicioDia.insertCell(3);

                cell1InicioDia.innerHTML = produto.nome;
                cell2InicioDia.innerHTML = produto.quantidade;
                cell3InicioDia.innerHTML = produto.preco;

                // Adiciona botões de atualização e remoção na tabela de início do dia (se o dia estiver aberto)
                if (isDiaAberto) {
                    var btnAtualizarQuantidade = document.createElement("button");
                    btnAtualizarQuantidade.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Atualizar Quantidade ';
                    btnAtualizarQuantidade.onclick = function () {
                        atualizarQuantidadeInicioDia(childSnapshot.key);
                    };
                    cell4InicioDia.appendChild(btnAtualizarQuantidade);

                    var btnRemoverProduto = document.createElement("button");
                    btnRemoverProduto.innerHTML = '<i class="bi bi-trash3-fill"></i>';
                    btnRemoverProduto.onclick = function () {
                        removerProdutoInicioDia(childSnapshot.key);
                    };
                    cell4InicioDia.appendChild(btnRemoverProduto);
                }

                totalProdutos += produto.quantidade;
            }
        });

        document.getElementById("totalProdutos").innerHTML = totalProdutos;
       
    });
}

function removerDuplicatas() {
    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    var linhas = tabelaInicioDia.rows;
    var nomesExistentes = new Set();

    for (var i = linhas.length - 1; i >= 1; i--) {
        var nome = linhas[i].cells[0].innerText.trim();

        // Verifica se o nome já foi encontrado
        if (nomesExistentes.has(nome)) {
            tabelaInicioDia.deleteRow(i); // Remove a linha duplicada
        } else {
            nomesExistentes.add(nome);
        }
    }
}

function mostrarFormularioPedido() {
    const pedidoForm = document.getElementById("formularioPedido");
    pedidoForm.style.display = "block";
}

function fecharFormularioPedido() {
    const pedidoForm = document.getElementById("formularioPedido");
    pedidoForm.style.display = "none";
}

let pedidosPendentes = [];  // Lista para armazenar pedidos pendentes
let pedidosFinalizados = [];  // Lista para armazenar pedidos finalizados

function adicionarAoPedido() {
    const produto = document.getElementById("produto").value;
    const quantidade = document.getElementById("quantidade").value;

    if (produto && quantidade) {
        const novoPedido = `Produto: ${produto}, Quantidade: ${quantidade}`;
        pedidosPendentes.push(novoPedido);
        salvarPedidosFinalizadosNoFirebase();
        limparCampos();
        alert("Produto adicionado ao pedido!");
    } else {
        alert("Por favor, preencha todos os campos.");
    }
}

function limparCampos() {
    document.getElementById("produto").value = "";
    document.getElementById("quantidade").value = "";
}

function enviarPedidoAoFornecedor(numeroFornecedor) {
    if (pedidosPendentes.length > 0) {
        const mensagem = encodeURIComponent(`Novo Pedido:\n${pedidosPendentes.join('\n')}`);
        const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroFornecedor}&text=${mensagem}`;
        window.open(urlWhatsApp, '_blank');
        
        // Mover pedidos pendentes para pedidos finalizados
        pedidosFinalizados = pedidosFinalizados.concat(pedidosPendentes);
        salvarPedidosFinalizadosNoFirebase();
        pedidosPendentes = [];
        
        alert("Pedido enviado ao fornecedor!");
    } else {
        alert("O pedido está vazio. Adicione produtos antes de enviar.");
    }
}

function exibirPedidosFinalizados() {
    var modal = document.getElementById('modalfinalizado');
    modal.style.display = 'block';
    const listaPedidosFinalizados = document.getElementById("listaPedidosFinalizados");
    listaPedidosFinalizados.innerHTML = ""; // Limpa a lista antes de atualizar

    if (pedidosFinalizados.length > 0) {
        pedidosFinalizados.forEach((pedido, index) => {
            const listItem = document.createElement("li");
            listItem.textContent = pedido;

            // Adiciona botão de exclusão
            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = function () {
                deleteP(index);
            };

            // Adiciona botão de chegou
            const btnChegou = document.createElement("button");
            btnChegou.textContent = "Chegou";
            btnChegou.onclick = function () {
                marcarComoChegou(index);
            };

            listItem.appendChild(btnExcluir);
            listItem.appendChild(btnChegou);
            listaPedidosFinalizados.appendChild(listItem);
        });
        console.log(pedidosFinalizados);
    } else {
        listaPedidosFinalizados.innerHTML = "<p>Nenhum pedido finalizado.</p>";
    }
}

function deleteP(index) {
    // Remove o pedido do array pedidosFinalizados
    const pedidoExcluido = pedidosFinalizados.splice(index, 1)[0];

    // Remove o pedido do Firebase
    var referenciaPedidosFinalizados = database.ref('pedidosFinalizados');
    referenciaPedidosFinalizados.once('value').then(snapshot => {
        snapshot.forEach(childSnapshot => {
            var dadosPedido = childSnapshot.val();
            if (dadosPedido.pedido === pedidoExcluido) {
                childSnapshot.ref.remove().then(function() {
                    console.log('Pedido excluído do Firebase.');
                    // Após excluir do Firebase, atualiza a interface do usuário
                    atualizarListaPedidosFinalizados();
                }).catch(function(error) {
                    console.error('Erro ao excluir pedido do Firebase:', error);
                });
            }
        });
    });
}


function marcarComoChegou(index) {
    const pedidoExcluido = pedidosFinalizados[index];

    // Obtenha informações relevantes do pedido (por exemplo, nome do produto e quantidade)
    const regexResult = /Produto: (.+), Quantidade: (\d+)/.exec(pedidoExcluido);

    if (regexResult) {
        const nomeProduto = regexResult[1];
        const quantidadeChegou = parseInt(regexResult[2]);

        console.log(`Nome do Produto: ${nomeProduto}, Quantidade Chegou: ${quantidadeChegou}`);

        // Atualize a tabela com as informações do pedido que chegou
        adicionarQuantidadeTabela(nomeProduto, quantidadeChegou);

        // Remova o pedido da lista de pedidos finalizados
        deleteP(index);
    }
}

function adicionarQuantidadeTabela(nomeProduto, quantidadeChegou) {
    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    var linhas = tabelaInicioDia.rows;

    for (var i = 1; i < linhas.length; i++) {
        var colunas = linhas[i].cells;
        var nomeProdutoNaTabela = colunas[0].textContent.trim();

        if (nomeProdutoNaTabela === nomeProduto) {
            // Use o atributo para armazenar e recuperar a quantidade
            var celulaQuantidade = colunas[1];
            var quantidadeNaTabela = parseInt(colunas[1].textContent.trim(), 10);

            console.log(`Quantidade atual na tabela para ${nomeProduto}: ${quantidadeNaTabela}`);
            
            // Atualize a quantidade no Firebase
            var novaQuantidade = quantidadeNaTabela + quantidadeChegou;
            console.log(`Nova quantidade após a soma: ${novaQuantidade}`);
            atualizarQuantidadeFirebase(nomeProduto, novaQuantidade);
            
            // Atualize diretamente a tabela na interface do usuário
            celulaQuantidade.textContent = novaQuantidade;
            celulaQuantidade.dataset.quantidade = novaQuantidade;

            console.log(`Quantidade atualizada para ${nomeProduto}: ${novaQuantidade}`);
            break;
        }
    }
}

function atualizarQuantidadeFirebase(nomeProduto, novaQuantidade) {
    if (!isNaN(novaQuantidade)) {
        database.ref('produtos').orderByChild('nome').equalTo(nomeProduto).once('value').then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                // Atualize a propriedade de quantidade do produto
                childSnapshot.ref.update({
                    quantidade: novaQuantidade
                }).then(function() {
                    console.log('Produto atualizado no Firebase com nova quantidade:', novaQuantidade);

                    // Exiba uma notificação
                    exibirNotificacao('Produto Alterado', 'Um produto foi atualizado: ' + nomeProduto + ' - ' + novaQuantidade + ' unidades');
                }).catch(function(error) {
                    console.error('Erro ao atualizar produto no Firebase:', error);
                });
            });
        });
    } else {
        alert("Por favor, digite um valor válido para a nova quantidade.");
    }
}

// Dentro da função que adiciona pedidos finalizados no Firebase
function salvarPedidosFinalizadosNoFirebase() {
    var referenciaPedidosFinalizados = database.ref('pedidosFinalizados');
    
    // Adiciona cada pedido finalizado ao banco de dados
    pedidosFinalizados.forEach(function (pedido) {
        var novoPedidoRef = referenciaPedidosFinalizados.push(); // Gera um identificador exclusivo
        novoPedidoRef.set({
            pedido: pedido,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    });
}


function carregarPedidosFinalizadosDoFirebase() {
    return new Promise((resolve, reject) => {
        console.log('Iniciando carga de pedidos finalizados.');

        var referenciaPedidosFinalizados = database.ref('pedidosFinalizados');
        const listaPedidosFinalizados = document.getElementById("listaPedidosFinalizados");

        referenciaPedidosFinalizados.once('value').then(snapshot => {
            console.log('Dados recebidos:', snapshot.val());

            
            snapshot.forEach(childSnapshot => {
                var dadosPedido = childSnapshot.val();
                var pedido = dadosPedido.pedido;

                // Processa cada pedido conforme necessário
                // Por exemplo, você pode exibi-los na interface do usuário
                console.log('Pedido Finalizado:', pedido);

                pedidosFinalizados.push(pedido);
            });

            // Atualiza a interface do usuário
            atualizarListaPedidosFinalizados();

            console.log('Carga de pedidos finalizados concluída.');
            resolve();  // Resolvendo a promessa quando o carregamento for concluído com sucesso
        }).catch(error => {
            console.error('Erro ao carregar pedidos finalizados:', error);
            reject(error);  // Rejeitando a promessa em caso de erro
        });
    });
}

function atualizarListaPedidosFinalizados() {
    const listaPedidosFinalizados = document.getElementById("listaPedidosFinalizados");

    // Limpa a lista antes de atualizar
    listaPedidosFinalizados.innerHTML = "";

    if (pedidosFinalizados.length > 0) {
        pedidosFinalizados.forEach(function (pedido) {
            const listItem = document.createElement("li");
            listItem.textContent = pedido;
            listaPedidosFinalizados.appendChild(listItem);
             // Adiciona botão de exclusão
             const btnExcluir = document.createElement("button");
             btnExcluir.textContent = "Excluir";
             btnExcluir.onclick = function () {
                 deleteP(index);
             };
 
             // Adiciona botão de chegou
             const btnChegou = document.createElement("button");
             btnChegou.textContent = "Chegou";
             btnChegou.onclick = function () {
                 marcarComoChegou(index);
             };
 
             listItem.appendChild(btnExcluir);
             listItem.appendChild(btnChegou);
             listaPedidosFinalizados.appendChild(listItem);
        });
    } else {
        // Adicione uma mensagem se não houver pedidos finalizados
        const listItem = document.createElement("li");
        listItem.textContent = "Nenhum pedido finalizado.";
        listaPedidosFinalizados.appendChild(listItem);
    }
}


window.onload = function() {
    carregarPedidosFinalizadosDoFirebase()
        .then(() => {
            // Outras operações de inicialização, se necessário
        })
        .catch(error => {
            console.error('Erro durante o carregamento de pedidos finalizados:', error);
            // Trate o erro conforme necessário
        });
};


function formatarData(data) {
    if (typeof data === 'string') {
        data = new Date(data);
    }
    if (!(data instanceof Date) || isNaN(data)) {
        console.error("A data fornecida não é válida.");
        return null;  // ou lançar uma exceção, dependendo do comportamento desejado
    }
    var dia = data.getDate();
    var mes = data.getMonth() + 1; // Os meses são indexados de 0 a 11
    var ano = data.getFullYear();
    var hora = data.getHours();
    var minutos = data.getMinutes();
    var segundos = data.getSeconds();

    // Adiciona zero à esquerda se for menor que 10
    dia = dia < 10 ? '0' + dia : dia;
    mes = mes < 10 ? '0' + mes : mes;
    hora = hora < 10 ? '0' + hora : hora;
    minutos = minutos < 10 ? '0' + minutos : minutos;
    segundos = segundos < 10 ? '0' + segundos : segundos;

    return `${ano}-${mes}-${dia} ${hora}:${minutos}:${segundos}`;
}

var dadosInicioDia = [];
var dadosFimDia = [];
var relatoriosGerados = [];

function calcularDiferencasEExportar() {
    // Chama a função para preencher os arrays de dados
    preencherArrays();

    var diferencaArray = [];
    var valorTotalEstoque = 0;
    var totalProdutosVendidos = 0;
    var valorTotalVendido = 0;
    var variacaoDiaAnterior = 0;
    var entradasProdutos = [];
    var produtosQuantidadeBaixa = [];
    var produtosQuantidadeAlta = [];

    // Adiciona um cabeçalho ao array
    diferencaArray.push(`Sua Marca Aqui\nRelatório de Estoque e Vendas - ${formatarData(new Date())}`);

    // Adiciona uma seção para o estoque atual
    diferencaArray.push("\nESTOQUE ATUAL:");

    for (var i = 0; i < dadosInicioDia.length; i++) {
        var produtoInicioDia = dadosInicioDia[i].produto;
        var quantidadeInicioDia = dadosInicioDia[i].quantidade;
        var precoInicioDia = dadosInicioDia[i].preco;

        diferencaArray.push(`${produtoInicioDia}: ${quantidadeInicioDia}`);
        valorTotalEstoque += quantidadeInicioDia * precoInicioDia;

        // Verifica variação em relação ao dia anterior
        var dadosDiaAnterior = dadosFimDia.find(item => item.produto === produtoInicioDia);
        if (dadosDiaAnterior) {
            variacaoDiaAnterior += (quantidadeInicioDia - dadosDiaAnterior.quantidade) * precoInicioDia;
        } else {
            entradasProdutos.push(`Entrada de ${quantidadeInicioDia} unidades do produto ${produtoInicioDia}`);
        }

        // Verifica produtos com quantidades baixas e altas
        if (quantidadeInicioDia <= 5) {
            produtosQuantidadeBaixa.push(`Estoque baixo para o produto ${produtoInicioDia}`);
        } else if (quantidadeInicioDia >= 20) {
            produtosQuantidadeAlta.push(`Estoque alto para o produto ${produtoInicioDia}`);
        }
    }

    for (var i = 0; i < historicoMovimentacao.length; i++) {
        var movimentacao = historicoMovimentacao[i];
        var dataMovimentacao = formatarData(movimentacao.data);
        // Atualiza as informações totais de vendas
        if (movimentacao.tipo.toUpperCase() === "saida") {
            totalProdutosVendidos += movimentacao.quantidade;
            var precoProduto = dadosInicioDia.find(item => item.produto === movimentacao.produto)?.preco || 0;
            valorTotalVendido += movimentacao.quantidade * precoProduto;
        }
    }

    // Adiciona métricas adicionais ao relatório
    diferencaArray.push(`\nVARIAÇÃO EM RELAÇÃO AO DIA ANTERIOR: ${variacaoDiaAnterior.toFixed(2)}`);
    diferencaArray.push("\nPRODUTOS COM QUANTIDADES BAIXAS:");
    produtosQuantidadeBaixa.forEach(produto => diferencaArray.push(produto));
    diferencaArray.push("\nPRODUTOS COM QUANTIDADES ALTAS:");
    produtosQuantidadeAlta.forEach(produto => diferencaArray.push(produto));

    console.log("Valor Total Estoque (Antes de adicionar ao relatório):", valorTotalEstoque.toFixed(2));
    // Adiciona o valor total do estoque ao relatório
    diferencaArray.push(`\nVALOR TOTAL EM ESTOQUE: ${valorTotalEstoque.toFixed(2)}`);
    // Adiciona o total de produtos vendidos e o valor total vendido ao relatório
    diferencaArray.push(`TOTAL DE PRODUTOS VENDIDOS: ${totalProdutosVendidos}`);
    diferencaArray.push(`VALOR TOTAL VENDIDO: R$ ${valorTotalVendido.toFixed(2)}`);
    diferencaArray.push("\nHISTÓRICO DE MOVIMENTAÇÃO:");

    for (var i = 0; i < historicoMovimentacao.length; i++) {
        var movimentacao = historicoMovimentacao[i];
        var dataMovimentacao = formatarData(movimentacao.data);

        diferencaArray.push(`${dataMovimentacao} - ${movimentacao.tipo.toUpperCase()} - Produto: ${movimentacao.produto}, Quantidade: ${movimentacao.quantidade}`);
    }

    if (diferencaArray.length > 2) {
        console.log("Relatório de Estoque e Vendas:");

        // Exibe no console as diferenças formatadas
        diferencaArray.forEach(item => console.log(item));

        var texto = diferencaArray.join('\n');

        // Download do arquivo de texto
        var link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(texto);
        link.download = `SuaMarcaAquirelatorio_estoque_vendas_${formatarData(new Date())}.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.error("Não há dados para gerar o relatório.");
    }
}

function preencherArrays() {
    dadosInicioDia = [];
    dadosFimDia = [];

    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    var tabelaFimDia = document.getElementById('tabelaFimDia');

    // Preencher o array de dados do início do dia
    for (var i = 1; i < tabelaInicioDia.rows.length; i++) {
        var produtoInicioDia = tabelaInicioDia.rows[i].cells[0].innerText.trim();
        var quantidadeInicioDia = parseInt(tabelaInicioDia.rows[i].cells[1].innerText.trim());
        var precoInicioDia = parseFloat(tabelaInicioDia.rows[i].cells[2].innerText.trim());
        dadosInicioDia.push({ produto: produtoInicioDia, quantidade: quantidadeInicioDia, preco: precoInicioDia });
    }

    // Preencher o array de dados do final do dia
    for (var j = 1; j < tabelaFimDia.rows.length; j++) {
        var produtoFimDia = tabelaFimDia.rows[j].cells[0].innerText.trim();
        var quantidadeFimDia = parseInt(tabelaFimDia.rows[j].cells[1].innerText.trim());
        dadosFimDia.push({ produto: produtoFimDia, quantidade: quantidadeFimDia });
    }

    console.log('Dados do Início do Dia:', dadosInicioDia);
    console.log('Dados do Fim do Dia:', dadosFimDia);
}


function atualizarTabelaInicioDia() {
    var tabelaInicioDia = document.getElementById("tabelaInicioDia");
    var totalProdutos = 0;

    nomesUnicos = [];

    // Limpa a tabela de início do dia
    while (tabelaInicioDia.rows.length > 1) {
        tabelaInicioDia.deleteRow(1);
    }

    // Preenche a tabela de início do dia com dados do banco de dados
    database.ref('produtos').once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var produto = childSnapshot.val();

            if (nomesUnicos.indexOf(produto.nome) === -1) {
                nomesUnicos.push(produto.nome);

                var rowInicioDia = tabelaInicioDia.insertRow(-1);
                var cell1InicioDia = rowInicioDia.insertCell(0);
                var cell2InicioDia = rowInicioDia.insertCell(1);
                var cell3InicioDia = rowInicioDia.insertCell(2);
                var cell4InicioDia = rowInicioDia.insertCell(3);

                cell1InicioDia.innerHTML = produto.nome;
                cell2InicioDia.innerHTML = produto.quantidade;
                cell3InicioDia.innerHTML = produto.preco;

                if (isDiaAberto) {
                    var btnAtualizarQuantidade = document.createElement("button");
                    btnAtualizarQuantidade.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Atualizar Quantidade ';
                    btnAtualizarQuantidade.onclick = function () {
                        atualizarQuantidadeInicioDia(childSnapshot.key);
                    };
                    cell4InicioDia.appendChild(btnAtualizarQuantidade);

                    var btnRemoverProduto = document.createElement("button");
                    btnRemoverProduto.innerHTML = '<i class="bi bi-trash3-fill"></i>';
                    btnRemoverProduto.onclick = function () {
                        removerProdutoInicioDia(childSnapshot.key);
                    };
                    cell4InicioDia.appendChild(btnRemoverProduto);
                }

                totalProdutos += produto.quantidade;
            }
        });

        document.getElementById("totalProdutos").innerHTML = totalProdutos;
    });
}

function limparTabelaFimDia() {
    var tabelaFimDia = document.getElementById("tabelaFimDia");

    // Limpa a tabela de fim do dia
    while (tabelaFimDia.rows.length > 1) {
        tabelaFimDia.deleteRow(1);
    }
}

function atualizarTabelaFimComInicio() {
   if (!isDiaAberto){
    var tabelaInicioDia = document.getElementById("tabelaInicioDia");
    var tabelaFimDia = document.getElementById("tabelaFimDia");

    // Limpa a tabela de fim do dia antes de adicionar os dados da tabela de início
    

    // Adiciona os dados da tabela de início à tabela de fim
    for (var i = 1; i < tabelaInicioDia.rows.length; i++) {
        var rowInicioDia = tabelaInicioDia.rows[i];
        var rowFimDia = tabelaFimDia.insertRow(-1);

        for (var j = 0; j < rowInicioDia.cells.length; j++) {
            var cellInicioDia = rowInicioDia.cells[j];
            var cellFimDia = rowFimDia.insertCell(j);
            cellFimDia.innerHTML = cellInicioDia.innerHTML;
        }
    }
   }
}

function limparTabelaInicioDia() {
    var tabelaInicioDia = document.getElementById("tabelaInicioDia");

    // Limpa a tabela de início do dia
    while (tabelaInicioDia.rows.length > 1) {
        tabelaInicioDia.deleteRow(1);
    }
}

// Função para atualizar a tabela de início com os dados da tabela de fim
function atualizarTabelaInicioComFim() {
    var tabelaInicioDia = document.getElementById("tabelaInicioDia");
    var tabelaFimDia = document.getElementById("tabelaFimDia");

    // Limpa a tabela de início do dia antes de adicionar os dados da tabela de fim
    limparTabelaInicioDia();

    // Adiciona os dados da tabela de fim à tabela de início
    for (var i = 1; i < tabelaFimDia.rows.length; i++) {
        var rowFimDia = tabelaFimDia.rows[i];
        var rowInicioDia = tabelaInicioDia.insertRow(-1);

        for (var j = 0; j < rowFimDia.cells.length; j++) {
            var cellFimDia = rowFimDia.cells[j];
            var cellInicioDia = rowInicioDia.insertCell(j);
            cellInicioDia.innerHTML = cellFimDia.innerHTML;
        }
    }
}

// Exemplo de uso:
// Chamada para limpar a tabela de início e adicionar os dados da tabela de fim
// Função para remover duplicatas da tabela de fim do dia
function removerDuplicatasTabelaFim() {
    var tabelaFimDia = document.getElementById("tabelaFimDia");
    var nomesUnicos = [];

    for (var i = tabelaFimDia.rows.length - 1; i >= 1; i--) {
        var nomeProduto = tabelaFimDia.rows[i].cells[0].innerText.trim();

        // Verifica se o nome já foi encontrado
        if (nomesUnicos.indexOf(nomeProduto) === -1) {
            nomesUnicos.push(nomeProduto);
        } else {
            tabelaFimDia.deleteRow(i); // Remove a linha duplicada
        }
    }
}

// Função para tornar as tabelas sempre visíveis
function tornarTabelasVisiveis() {
    var tabelaInicioDia = document.getElementById('tabelaInicioDia');
    var tabelaFimDia = document.getElementById('tabelaFimDia');

    // Define a propriedade display para 'table'
    tabelaInicioDia.style.display = 'table';
    tabelaFimDia.style.display = 'table';
}

function carregarHistoricoMovimentacao() {
    historicoMovimentacaoRef.once('value')
        .then((snapshot) => {
            historicoMovimentacao = snapshot.val() || [];
        })
        .catch((error) => {
            console.error('Erro ao buscar o historicoMovimentacao:', error);
        });
}

var historicoMovimentacao = [];

const historicoMovimentacaoRef = database.ref('historicoMovimentacao');

function adicionarMovimentacao(produto, quantidade, tipo) {
    var dataAtual = new Date();
    var movimentacaoEntry = {
        data: dataAtual.toISOString(), // Convert date to string for Firebase
        produto: produto,
        quantidade: quantidade,
        tipo: tipo // 'entrada' ou 'saida'
    };

    carregarHistoricoMovimentacao();

    // Push the new entry to the historicoMovimentacao array
    historicoMovimentacao.push(movimentacaoEntry);

    // Save historicoMovimentacao to Firebase
    historicoMovimentacaoRef.set(historicoMovimentacao);
}

// Função para calcular a média da quantidade de um produto nos últimos 5 dias

// Função para salvar dados no Firebase
function salvarDadosTabelaFimLocal() {
    var tabelaFimDia = document.getElementById("tabelaFimDia");
    var dadosTabelaFim = [];

    for (var i = 1; i < tabelaFimDia.rows.length; i++) {
        var produto = tabelaFimDia.rows[i].cells[0].innerText.trim();
        var quantidade = parseInt(tabelaFimDia.rows[i].cells[1].innerText.trim());
        var preco = parseFloat(tabelaFimDia.rows[i].cells[2].innerText.trim());

        dadosTabelaFim.push({
            produto: produto,
            quantidade: quantidade,
            preco: preco
        });
    }

    // Salva os dados no Firebase
    var database = firebase.database();
    var dadosRef = database.ref('dadosTabelaFim');

    dadosRef.set(dadosTabelaFim)
        .then(function () {
            console.log("Dados salvos no Firebase com sucesso:", dadosTabelaFim);
        })
        .catch(function (error) {
            console.error("Erro ao salvar dados no Firebase:", error);
        });
}

// Função para recuperar dados do Firebase
function restaurarDadosTabelaFimLocal() {
    // Obter uma referência para o elemento de tabela HTML com o id "tabelaFimDia"
    var tabelaFimDia = document.getElementById("tabelaFimDia");

    // Obter uma referência para o Banco de Dados em Tempo Real do Firebase
    var database = firebase.database();

    // Criar uma referência para o nó "dadosTabelaFim" no banco de dados
    var dadosRef = database.ref('dadosTabelaFim');

    // Recuperar dados do Firebase uma vez
    dadosRef.once('value')
        .then(function(snapshot) {
            // Extrair os dados do snapshot
            var dadosTabelaFim = snapshot.val();

            // Verificar se há dados disponíveis
            if (dadosTabelaFim) {
                // Limpar as linhas e o cabeçalho existentes na tabela HTML
                tabelaFimDia.innerHTML = '';

                // Adicionar o cabeçalho da tabela com uma classe CSS específica
                var headerRow = tabelaFimDia.insertRow(0);
                headerRow.classList.add("cabecalho-tabela"); // Adicionar classe específica ao cabeçalho

                var headerCell1 = headerRow.insertCell(0);
                var headerCell2 = headerRow.insertCell(1);
                var headerCell3 = headerRow.insertCell(2);

                // Definir o conteúdo das células do cabeçalho
                headerCell1.innerHTML = "Produto";
                headerCell2.innerHTML = "Quantidade";
                headerCell3.innerHTML = "Preço Unit. (R$)";

                // Adicionar linhas à tabela com base nos dados recuperados
                dadosTabelaFim.forEach(function (dados, index) {
                    var rowFimDia = tabelaFimDia.insertRow(-1);
                    rowFimDia.classList.add("corpo-tabela");
                    var cell1FimDia = rowFimDia.insertCell(0);
                    var cell2FimDia = rowFimDia.insertCell(1);
                    var cell3FimDia = rowFimDia.insertCell(2);

                    // Preencher as células com dados do objeto recuperado
                    cell1FimDia.innerHTML = dados.produto;
                    cell2FimDia.innerHTML = dados.quantidade;
                    cell3FimDia.innerHTML = dados.preco;
                });
            }
        })
        .catch(function (error) {
            // Lidar com erros, se houver, durante a recuperação de dados
            console.error("Erro ao recuperar dados do Firebase:", error);
        });
}   

function estimarEstoqueAtualSeteDiasAtras() {
    carregarHistoricoMovimentacao();

    // Objeto para armazenar as estimativas de cada produto
    var estimativas = {};

    // Data atual
    var dataAtual = new Date();

    // Data há 7 dias
    var dataSeteDiasAtras = new Date();
    dataSeteDiasAtras.setDate(dataSeteDiasAtras.getDate() - 7);

    // Array para armazenar as estimativas formatadas para exibição em HTML
    var estimativasHTML = [];

    for (var i = 0; i < historicoMovimentacao.length; i++) {
        var movimentacao = historicoMovimentacao[i];
        var dataMovimentacao = new Date(movimentacao.data);

        // Verifica se a movimentação está dentro do intervalo de 7 dias
        if (dataMovimentacao >= dataSeteDiasAtras && dataMovimentacao <= dataAtual) {
            var produto = movimentacao.produto;
            var quantidade = movimentacao.quantidade;

            // Verifica se o produto já está no objeto de estimativas
            if (!estimativas[produto]) {
                estimativas[produto] = {
                    totalVendido: 0,
                    diasContados: 0
                };
            }

            // Atualiza as estimativas para o produto
            estimativas[produto].totalVendido += quantidade;
            estimativas[produto].diasContados += 1;
        }
    }

    // Calcula a média diária para cada produto e adiciona à lista HTML
    for (var produto in estimativas) {
        if (estimativas.hasOwnProperty(produto)) {
            var mediaDiaria = estimativas[produto].totalVendido / estimativas[produto].diasContados;

            // Adiciona à lista HTML
            estimativasHTML.push(`<li>Estimativa para ${produto} nos últimos 7 dias: ${mediaDiaria} unidades por dia.</li>`);
        }
    }

    // Exibe a lista em um modal (exemplo simples, ajuste conforme necessário)
    var modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `<ul>${estimativasHTML.join('')}</ul>`;

    // Abre o modal (exemplo simples, ajuste conforme necessário)
    var modal = document.getElementById('myModalestimativa');
    modal.style.display = 'block';
}




carregarHistoricoMovimentacao();

restaurarDadosTabelaFimLocal();

atualizarTabela();

tornarTabelasVisiveis();

removerDuplicatasTabelaFim();

preencherArrays();

removerDuplicatas();