Uma alteração bancária de fornecedor pode parecer só mais uma atualização cadastral. Mas e se o pedido não veio de quem deveria?

Foi pensando nesse risco que desenvolvi o **Confere.**, um protótipo de fluxo de conferência e aprovação de alterações bancárias de fornecedores.

A ideia é simples: antes de mudar qualquer dado, precisamos saber **o que mudou, quem conferiu e por que a decisão foi tomada**.

Na demonstração, implementei:

🔸 Comparação entre os dados bancários cadastrados e os propostos.
🔸 Confirmação pelo contato de referência e validação declarada de titularidade.
🔸 Separação entre quem confere e quem aprova, com uma segunda revisão.
🔸 Registro de aprovações, rejeições e justificativas.
🔸 Histórico de eventos, exportação JSON e versão para impressão.

Desenvolvi a interface com **HTML, CSS e JavaScript puro**, sem framework, e testei as regras de negócio com **Node.js**. Também preparei uma versão responsiva para celular.

É importante destacar: **é uma demonstração com dados fictícios, sem backend ou integração com bancos**. O objetivo foi praticar desenho de processos, validações e experiência de uso, não simular uma proteção pronta para produção.

Esse projeto junta duas áreas de que gosto muito: **desenvolvimento de sistemas e Segurança da Informação**.

🔗 Código e documentação: https://github.com/Gabriel-Dias-Santiago/confere-demo

E aí, qual controle você adicionaria antes de liberar uma alteração bancária de fornecedor?

#SegurancaDaInformacao #DesenvolvimentoWeb #Governanca #PrevencaoAFraudes #JavaScript #Portfolio

---

**Material recomendado para o post:** publique as 5 imagens `01-linkedin.png` a `05-linkedin.png` como carrossel e inclua o vídeo `confere-demo.mp4` em um post separado, se desejar. **Importante:** a URL na legenda só funcionará depois da publicação do repositório `confere-demo`. Não publique a legenda antes de verificar o link.
