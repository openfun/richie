const fs = require('fs');
const path = require('path');
const request = require('request-promise');

// Get file to upload from command line arguments
const [_, __, fileName, filePath] = process.argv;
if (!fileName || !filePath) {
  console.log('⚠️  missing file to upload, aborting.');
  process.exit(1);
}

// Get project ID & key from environment variables
const { CROWDIN_API_KEY, CROWDIN_PROJECT_IDENTIFIER } = process.env;
if (!CROWDIN_API_KEY || !CROWDIN_PROJECT_IDENTIFIER) {
  console.log(
    '⚠️  missing necessary environment variables (CROWDIN_API_KEY, CROWDIN_PROJECT_IDENTIFIER), aborting.',
  );
  process.exit(1);
}

// Run the uploader for the passed file
createOrUpdateFile(fileName, filePath);

// Attempt to update the file (most common operation), default to creating it
// if it does not exist (initial setup)
function createOrUpdateFile(fileName, filePath, shouldCreateFile) {
  console.log(
    `🙈 uploading ${fileName} [${shouldCreateFile ? 'CREATE' : 'UPDATE'}]...`,
  );

  // Crowdin expects the POST request to contain the files in form data format
  const formData = {
    [`files[${fileName}]`]: fs.createReadStream(
      path.join(__dirname + filePath),
    ),
    json: JSON.stringify(true),
  };

  // Crowdin API action keywords/routes
  const keyword = shouldCreateFile ? 'add-file' : 'update-file';

  request
    .post({
      formData,
      url: `https://api.crowdin.com/api/project/${CROWDIN_PROJECT_IDENTIFIER}/${keyword}?key=${CROWDIN_API_KEY}`,
    })
    .then(
      () => console.log(`🚀 uploaded ${fileName}.`),
      response => {
        const error =
          typeof response.error === 'string'
            ? JSON.parse(response.error)
            : response.error;
        if (error && error.error && error.error.code === 8) {
          console.log(
            `🙉 cannot update ${fileName}, attempting to create instead...`,
          );
          return createOrUpdateFile(fileName, filePath, true);
        } else if (error && error.code && error.code === 'ENOENT') {
          console.log(`👻 cannot find ${path.join(__dirname + filePath)}, aborting.`);
          process.exit(1);
        }

        console.log(`💥 failed to upload ${fileName}, aborting.`);
        process.exit(1);
      },
    );
}
