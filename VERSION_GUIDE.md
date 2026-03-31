# Guia de Versionamento - Conversy N8N

## Como Atualizar a Versão do Projeto

Este documento explica como atualizar a versão do projeto Conversy N8N de forma consistente e organizada.

### 📋 Localização da Versão

A versão do projeto é definida no arquivo `package.json` na propriedade `version`:

```json
{
  "name": "conversy-n8n",
  "version": "0.0.0",
  "private": true,
  ...
}
```

### 🔄 Como Atualizar

#### 1. Manualmente no package.json

Edite diretamente o arquivo `package.json` e altere o valor da propriedade `version`:

```json
{
  "version": "1.0.0"
}
```

#### 2. Usando npm version (Recomendado)

Use os comandos do npm para atualizar automaticamente:

```bash
# Patch (0.0.1 -> 0.0.2) - Para correções de bugs
npm version patch --no-git-tag-version

# Minor (0.0.1 -> 0.1.0) - Para novas funcionalidades
npm version minor --no-git-tag-version

# Major (0.1.0 -> 1.0.0) - Para mudanças que quebram compatibilidade
npm version major --no-git-tag-version

# Versão específica
npm version 1.2.3
```

#### 3. Usando yarn version

Se estiver usando Yarn:

```bash
# Patch
yarn version --patch

# Minor
yarn version --minor

# Major
yarn version --major

# Versão específica
yarn version --new-version 1.2.3
```

### 📝 Padrão de Versionamento (SemVer)

O projeto segue o padrão **Semantic Versioning (SemVer)**:

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

### 🎯 Onde a Versão Aparece

A versão é exibida automaticamente:

1. **Interface do Chat**: Aparece como um badge minimalista abaixo do campo de entrada
2. **Comando `/version`**: Retorna a versão atual quando executado no chat
3. **Console**: Disponível através de `packageJson.version` nos componentes

### 🔧 Componentes Relacionados

- **ProjectVersion.tsx**: Componente que exibe a versão na interface
- **ChatWidget.tsx**: Contém o comando `/version` para consulta
- **package.json**: Arquivo principal onde a versão é definida

### ✅ Checklist para Atualização

Ao atualizar a versão:

- [ ] Definir o tipo de mudança (patch/minor/major)
- [ ] Executar o comando apropriado (`npm version`)
- [ ] Verificar se a nova versão aparece na interface
- [ ] Testar o comando `/version` no chat
- [ ] Documentar as mudanças (se necessário)

### 🚀 Exemplo Prático

```bash
# Situação atual: v0.0.0
# Adicionando nova funcionalidade

npm version minor
# Resultado: v0.1.0

# A versão será automaticamente atualizada em:
# - package.json
# - Interface do chat
# - Comando /version
```

### 📚 Recursos Adicionais

- [Semantic Versioning](https://semver.org/)
- [npm version docs](https://docs.npmjs.com/cli/v8/commands/npm-version)
- [Yarn version docs](https://classic.yarnpkg.com/en/docs/cli/version/)

---

**Nota**: Sempre teste a aplicação após atualizar a versão para garantir que tudo funciona corretamente.