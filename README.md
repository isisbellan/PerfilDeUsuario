# Perfil de Usuário

Este é um projeto full-stack desenvolvido para que os usuários criem perfis através de cadastro, os gerenciem através de edição de dados, visualizem seus perfis com as informações pessoais, como foto de perfil, nome completo, biografia, entre outros.

## Tecnologias utilizadas
* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js, Express.js
* **Banco de dados**: MySQL (hospedado no Railway)
* **Deploly**: frontend na Vercel, Backend no Render

## Pré-requisitos
Para executar este projeto localmente, deve-se conter instalados:
* **Node.js**: versão 14
* **npm**: gerenciador de pacotes do Node.js
* **MySQL**: um servidor MySQL rodando localmente
* **Git**: para clonar o repositório

## Instalação e execução local

* **1. Clonar o repositório**
Abra seu terminal ou prompt de comando e execute:

git clone https://github.com/isisbellan/PerfilDeUsuario.git
cd PerfilDeUsuario

* **2.Configurar o backend**
Navegue até a pasta backend através do comando "cd backend".

* **Instalar dependências**

npm install

* **Criar o arquivo .env**
Na raiz da pasta backend, crie um arquivo chamado .env e adicione as variáveis a seguir.

MYSQL_HOST=yamanote.proxy.rlwy.net
MYSQL_PORT=53032
MYSQL_USER=root
MYSQL_PASSWORD=FtoDvFcJXADwAiTAuyIXwYfYfTMBsFmG
MYSQL_DATABASE=railway
FRONTEND_URL=https://perfil-de-usuario-three.vercel.app
BACKEND_URL=https://perfildeusuario-e5k2.onrender.com

* **Criar o banco de dados e a tabela**
Conecte-se ao servidor MySQL local (usando MySQL workbench, por exemplo) para criar o banco de dados e a tabela usuario.

CREATE DATABASE railway
USE railway;

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    idade INT NOT NULL,
    rua VARCHAR(255) NOT NULL,
    bairro VARCHAR(255) NOT NULL,
    estado CHAR(2) NOT NULL,
    biografia TEXT,
    foto_perfil VARCHAR(255),
    senha VARCHAR(255) NOT NULL
);

* **Iniciar o servidor backend**

npm start

Assim, o servidor estará rodando em http://localhost:3000, ou na porta definida no arquivo .env

* **3.Configurar e executar o frontend**
Abra uma nova janela do terminal e navegue até a pasta frontend através do comando "cd frontend".

* **Abrir no navegador**
Ao estar no arquivo index.html, clique na opção "Open with live server".
Assim, o frontend será aberto em http://localhost:5500 (ou outra porta, dependendo do servidor).




