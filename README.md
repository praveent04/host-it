# HOST-IT

A simple CLI tool to dynamically update your hosts file with development domain mappings.

## Overview

HOST-IT is a command-line tool that simplifies managing local domain mappings in your hosts file for development purposes. It allows you to easily add, remove, list, and organize host entries without manually editing the hosts file.

## Features

- 🚀 **Easy Domain Management**: Add or remove domain mappings with simple commands
- 📋 **List Existing Entries**: View all current HOST-IT managed entries
- 🔄 **Backup & Restore**: Automatic backup of hosts file before making changes
- 🔒 **Safe Operations**: Admin/sudo privileges handling for hosts file modifications
- 🎯 **Domain Groups**: Organize domains into logical groups for better management
- 📱 **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

```bash
npm install -g host-it
```

## Usage

### Add a domain mapping

```bash
host-it add example.local 127.0.0.1
```

### Add multiple domains to a group

```bash
host-it add myapp.local,api.myapp.local 127.0.0.1 -g myproject
```

### Remove a domain mapping

```bash
host-it remove example.local
```

### Remove a group of domains

```bash
host-it remove -g myproject
```

### List all domain mappings

```bash
host-it list
```

### List specific group domains

```bash
host-it list -g myproject
```

### Check host file status

```bash
host-it status
```

## Command Reference

| Command | Description |
|---------|-------------|
| `add <domain> <ip> [-g group]` | Add a domain mapping to the hosts file |
| `remove <domain> [-g group]` | Remove a domain mapping from the hosts file |
| `list [-g group]` | List all HOST-IT managed entries or from a specific group |
| `status` | Show hosts file information and HOST-IT entries count |
| `help` | Display help information |

## Examples

### Add a local development domain

```bash
host-it add myproject.local 127.0.0.1
```

### Add multiple domains to a group

```bash
host-it add "app.local,api.local,admin.local" 127.0.0.1 -g projectx
```

### List all entries in a specific group

```bash
host-it list -g projectx
```

### Remove all domains in a group

```bash
host-it remove -g projectx
```

## Configuration

HOST-IT stores its configuration in `~/.host-it/config.json`. You can manually edit this file if needed, but it's recommended to use the CLI commands.

## How It Works

HOST-IT adds special comment markers to your hosts file to identify and manage its entries. This allows it to safely add, remove, and update entries without affecting other content in your hosts file.

## Requirements

- Node.js 14 or higher
- Admin/sudo privileges (only when modifying the hosts file)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Praveen T - [GitHub](https://github.com/praveent04)
