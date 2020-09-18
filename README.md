# copy-and-insert README

- 将选中到文件拷贝到目标目录，并将文件路径插入到当前文档。
- 默认插入到 ./src/assects
- 默认使用 @ => ./src 的文件映射

## 配置

- **copyAndInsert.path** 复制到目标文件夹, 默认为当前项目下 **./src/assets**
- **copyAndInsert.aliasKey** 映射名, 默认为 **@**
- **copyAndInsert.alias** @映射目录, 默认为当前项目下 **./src**

## 使用方式

在文件管理器中选中要拷贝的文件，然后切换到 code 中，选择命令 copy & paste 或者快捷键 ctrl+cmd+p ，插件将复制当前文件到目标文件夹，并且在当前光标位置插入当前文件路径。

目前还很粗糙，只支持 mac。主要为方便自己使用。如果碰巧你也需要，我也很高兴能够帮到你。
