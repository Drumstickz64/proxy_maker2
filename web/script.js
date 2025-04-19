import { generateProxy } from "/shared.js";

const fileInput = document.getElementById("imageUpload");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", function (e) {
  const files = e.target.files;
  if (files.length > 0) {
    const fileNames = Array.from(files).map((file) => file.name);
    fileName.textContent =
      files.length === 1 ? fileNames[0] : `${files.length} files selected`;

    // You can add image preview functionality here if needed
    console.log("Selected files:", fileNames);
  } else {
    fileName.textContent = "No files selected";
  }
});

// Handle form submission
document.getElementById("gridForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get values from the form
  const formData = {
    numCols: parseInt(document.getElementById("numCols").value),
    numRows: parseInt(document.getElementById("numRows").value),
    horizontalGap: parseInt(document.getElementById("horizontalGap").value),
    verticalGap: parseInt(document.getElementById("verticalGap").value),
    minHorizontalMargin: parseInt(
      document.getElementById("minHorizontalMargin").value
    ),
    minVerticalMargin: parseInt(
      document.getElementById("minVerticalMargin").value
    ),
  };

  // Get uploaded files
  const files = fileInput.files;

  // Display the form data and file info in the output area
  const outputArea = document.getElementById("outputArea");
  outputArea.innerHTML = `
                <div class="content">
                    <h3>Grid Parameters Submitted:</h3>
                    <ul>
                        <li>Columns: ${formData.numCols}</li>
                        <li>Rows: ${formData.numRows}</li>
                        <li>Horizontal Gap: ${formData.horizontalGap}px</li>
                        <li>Vertical Gap: ${formData.verticalGap}px</li>
                        <li>Min Horizontal Margin: ${
                          formData.minHorizontalMargin
                        }px</li>
                        <li>Min Vertical Margin: ${
                          formData.minVerticalMargin
                        }px</li>
                    </ul>
                    <h3>Images Uploaded: ${files.length}</h3>
                    ${
                      files.length > 0
                        ? `
                        <ul>
                            ${Array.from(files)
                              .map((file) => `<li>${file.name}</li>`)
                              .join("")}
                        </ul>
                    `
                        : "<p>No images uploaded</p>"
                    }
                </div>
            `;

  console.log("Form submitted with values:", formData);
  console.log("Files:", files);

  const promises = [];
  for (const file of files) {
    promises.push(file.arrayBuffer());
  }
  const images = await Promise.all(promises);

  const proxy = await generateProxy(images, formData);
  const blob = new Blob([proxy]);
  document.getElementById("test").src = URL.createObjectURL(blob);
});
