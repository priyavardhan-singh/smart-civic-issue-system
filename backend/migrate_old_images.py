from pathlib import Path
import os

from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

from database import db


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

load_dotenv(BASE_DIR / ".env")


# -----------------------------
# Cloudinary configuration
# -----------------------------

cloudinary.config(
    cloud_name=os.getenv(
        "CLOUDINARY_CLOUD_NAME"
    ),
    api_key=os.getenv(
        "CLOUDINARY_API_KEY"
    ),
    api_secret=os.getenv(
        "CLOUDINARY_API_SECRET"
    ),
    secure=True,
)


# -----------------------------
# Validate configuration
# -----------------------------

required_cloudinary_values = {
    "CLOUDINARY_CLOUD_NAME":
        os.getenv(
            "CLOUDINARY_CLOUD_NAME"
        ),

    "CLOUDINARY_API_KEY":
        os.getenv(
            "CLOUDINARY_API_KEY"
        ),

    "CLOUDINARY_API_SECRET":
        os.getenv(
            "CLOUDINARY_API_SECRET"
        ),
}


for key, value in (
    required_cloudinary_values.items()
):
    if not value:
        raise ValueError(
            f"{key} is missing "
            "from backend/.env"
        )


if not UPLOAD_DIR.exists():
    raise FileNotFoundError(
        f"Uploads folder not found: "
        f"{UPLOAD_DIR}"
    )


# -----------------------------
# Upload helper
# -----------------------------

def upload_old_image(
    local_file: Path,
    cloudinary_folder: str,
):
    print(
        f"Uploading: "
        f"{local_file.name}"
    )

    result = (
        cloudinary.uploader.upload(
            str(local_file),
            folder=cloudinary_folder,

            # Deterministic public ID.
            # This makes rerunning the
            # migration safer.
            public_id=local_file.stem,
            unique_filename=False,
            overwrite=True,

            resource_type="image",
        )
    )

    secure_url = (
        result.get(
            "secure_url"
        )
    )

    public_id = (
        result.get(
            "public_id"
        )
    )

    if not secure_url:
        raise RuntimeError(
            "Cloudinary did not return "
            f"a URL for {local_file.name}"
        )

    return secure_url, public_id


# -----------------------------
# Counters
# -----------------------------

issue_migrated = 0
resolution_migrated = 0

issue_skipped = 0
resolution_skipped = 0

missing_files = 0
failed_uploads = 0


# -----------------------------
# Find reports
# -----------------------------

reports = db.reports.find({})


for report in reports:
    report_id = report["_id"]

    print()
    print(
        "--------------------------------"
    )
    print(
        f"Report: {report_id}"
    )

    # =================================
    # ISSUE PHOTO
    # =================================

    photo_url = (
        report.get(
            "photo_url"
        )
    )

    photo_cloudinary_url = (
        report.get(
            "photo_cloudinary_url"
        )
    )

    if photo_url:

        if photo_cloudinary_url:
            print(
                "Issue photo already "
                "migrated. Skipping."
            )

            issue_skipped += 1

        else:
            filename = (
                Path(
                    photo_url
                ).name
            )

            local_file = (
                UPLOAD_DIR
                / filename
            )

            if not local_file.exists():
                print(
                    "MISSING issue photo: "
                    f"{filename}"
                )

                missing_files += 1

            else:
                try:
                    (
                        cloudinary_url,
                        cloudinary_public_id,
                    ) = upload_old_image(
                        local_file,
                        "smart-civic/reports",
                    )

                    db.reports.update_one(
                        {
                            "_id":
                                report_id
                        },
                        {
                            "$set": {
                                "photo_cloudinary_url":
                                    cloudinary_url,

                                "photo_cloudinary_public_id":
                                    cloudinary_public_id,
                            }
                        },
                    )

                    issue_migrated += 1

                    print(
                        "Issue photo "
                        "migration complete."
                    )

                except Exception as error:
                    failed_uploads += 1

                    print(
                        "FAILED issue photo:"
                    )

                    print(error)


    # =================================
    # RESOLUTION PHOTO
    # =================================

    resolution_photo_url = (
        report.get(
            "resolution_photo_url"
        )
    )

    resolution_cloudinary_url = (
        report.get(
            "resolution_photo_cloudinary_url"
        )
    )

    if resolution_photo_url:

        if resolution_cloudinary_url:
            print(
                "Resolution photo already "
                "migrated. Skipping."
            )

            resolution_skipped += 1

        else:
            filename = (
                Path(
                    resolution_photo_url
                ).name
            )

            local_file = (
                UPLOAD_DIR
                / filename
            )

            if not local_file.exists():
                print(
                    "MISSING resolution "
                    f"photo: {filename}"
                )

                missing_files += 1

            else:
                try:
                    (
                        cloudinary_url,
                        cloudinary_public_id,
                    ) = upload_old_image(
                        local_file,
                        "smart-civic/resolutions",
                    )

                    db.reports.update_one(
                        {
                            "_id":
                                report_id
                        },
                        {
                            "$set": {
                                "resolution_photo_cloudinary_url":
                                    cloudinary_url,

                                "resolution_photo_cloudinary_public_id":
                                    cloudinary_public_id,
                            }
                        },
                    )

                    resolution_migrated += 1

                    print(
                        "Resolution photo "
                        "migration complete."
                    )

                except Exception as error:
                    failed_uploads += 1

                    print(
                        "FAILED resolution "
                        "photo:"
                    )

                    print(error)


# -----------------------------
# Final summary
# -----------------------------

print()
print()
print(
    "================================"
)
print(
    "IMAGE MIGRATION FINISHED"
)
print(
    "================================"
)

print(
    "Issue photos migrated:",
    issue_migrated,
)

print(
    "Resolution photos migrated:",
    resolution_migrated,
)

print(
    "Issue photos already migrated:",
    issue_skipped,
)

print(
    "Resolution photos already migrated:",
    resolution_skipped,
)

print(
    "Missing local files:",
    missing_files,
)

print(
    "Failed uploads:",
    failed_uploads,
)

print(
    "================================"
)