const path = require("path");
const formidable = require("formidable");
const { Formatter } = require("k-utilities");
const CreateProductCommand = require("../../domain/command/create-product-command");

class CreateProductHandler {
  constructor(sellerRepository, storageProvider) {
    this.sellerRepository = sellerRepository;
    this.storageProvider = storageProvider;
    this.config = env.createProductHandler;
    this.filesInProcess = 0;
    this.formDataParser = formidable({ keepExtensions: false, multiples: false });
    this.formDataParser.maxFieldsSize = 20 * 1000000; // a MB = 1 million byte, a GB = 1000 MB
    this.formDataParser.maxFileSize = 1000 * 1000000;
    this.formDataParser.maxFields = 13;
    this.formDataParser.onPart = this.handelFile.bind(this);
  }

  handle(request, response) {
    this.formDataParser.on("field", (name, value) => this.handleField(name, value, request.user));
    this.product = { owner: request.user.id };
    this.command = {};

    const promise = new Promise((resolve, reject) => {
      this.formDataParser.on("error", (error) => {
        this.product = {};
        this.command = {};
        this.formDataParser = null;
        if (!response.finished) reject(error);
      });
      this.formDataParser.on("end", async () => {
        if (response.finished || this.filesInProcess > 0) return;
        try {
          await Promise.all(
            this.command.types.map(async (type) => {
              type.type = await this.uploadBase64File(type.type);
            })
          );
          const product = await this.sellerRepository.createProduct(this.command);
          this.product = {};
          this.command = {};
          this.formDataParser = null;
          return resolve(product);
        } catch (error) {
          this.formDataParser.emit("error", error);
        }
      });
    });

    this.formDataParser.parse(request);
    return promise;
  }

  async handleField(name, value, userInfo) {
    this.product[name] = value;
    if (Object.keys(this.product).length < 9) return;
    try {
      this.command = new CreateProductCommand({ ...this.product });
    } catch (error) {
      this.formDataParser.emit("error", error);
    }
  }

  async handelFile(part) {
    if (!part.filename || !part.mime) {
      return this.formDataParser ? this.formDataParser.handlePart(part) : null;
    }
    this.filesInProcess += 1;
    try {
      const imageExt = /\.(jpg|png|jpeg|gif|bmp|webp)$/i;
      const videoExt = /\.(WEBM|MPG|MP2|MP4|MPEG|MPE|MPV|OGG|M4P|M4V|AVI|WMV|MOV|QT|FLV|SWF|AVCHD)$/i;
      const test1 = imageExt.test(path.extname(part.filename.toLowerCase()));
      const test2 = videoExt.test(path.extname(part.filename.toLowerCase()));
      if (!test1 && !test2) throw Error(this.config.fileError);

      const fileName = `${Formatter.newId()}${path.extname(part.filename)}`;

      await new Promise((resolve, reject) => {
        const storage = this.storageProvider.storage.file(fileName).createWriteStream({ resumable: false });
        part.on("data", (chunk) => {
          this.formDataParser.pause();
          storage.write(chunk);
          this.formDataParser.resume();
        });
        part.on("end", () => storage.end());
        storage.on("error", reject).on("finish", resolve);
      });

      const index = this.command.types.findIndex((type) => type.type === part.name);

      if (index > -1) this.command.types[index].type = this.config.domain + fileName;
      else if (part.name === "video") this.command.video = this.config.domain + fileName;
      else if (part.name === "mainPicture") {
        this.command.pictures = `${this.config.domain}${fileName},` + this.command.pictures;
      } else this.command.pictures = this.command.pictures + `${this.config.domain}${fileName},`;

      this.filesInProcess -= 1;
      this.formDataParser.emit("end");
    } catch (error) {
      this.formDataParser.emit("error", error);
    }
  }
  async uploadBase64File(base64) {
    return new Promise((resolve, reject) => {
      // base64[1] is the mimeType
      const data = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!data || !data[1]) return resolve(base64); // then the base64 is normal text or url
      const fileName = Formatter.newId() + "." + data[1].split("/")[1];
      const options = { metadata: { contentType: data[1] } };
      const buffer = new Buffer.from(data[2], "base64");
      this.storageProvider.storage.file(fileName).save(buffer, options, (error) => {
        if (error) return reject(error);
        resolve(this.config.domain + fileName);
      });
    });
  }
}

module.exports = CreateProductHandler;
