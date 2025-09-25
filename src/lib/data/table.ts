export function getDataTableName(): string {
  const tableName = process.env.DYNAMODB_DATA_TABLE_NAME?.trim();
  if (tableName && tableName.length > 0) {
    return tableName;
  }
  return 'site-data';
}
