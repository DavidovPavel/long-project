using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Web;
using ExcelDataReader;

namespace www.SaGateway
{
    public static class ExcelHelper
    {
        public static DataSet ExportToDataset(string fileName)
        {
            string ext = Path.GetExtension(fileName).ToLower();
            if (!(ext == ".xls" || ext == ".xlsx"))
                throw new ArgumentException("File extension is invalid.");
            if (!File.Exists(fileName))
                throw new ArgumentException("File doesn't exists.");

            DataSet ds = null;
            IExcelDataReader excelReader = null;
            using (FileStream stream = File.Open(fileName, FileMode.Open, FileAccess.Read))
            {
                try
                {
                    excelReader = ext == ".xls" ? ExcelReaderFactory.CreateBinaryReader(stream) : ExcelReaderFactory.CreateOpenXmlReader(stream);

                    var config = new ExcelDataSetConfiguration()
                    {
                        ConfigureDataTable = (reader) => new ExcelDataTableConfiguration()
                        {
                            UseHeaderRow = true
                        }
                    };

                    ds = excelReader.AsDataSet(config);

                    excelReader.Close();
                }
                catch
                {
                    if (excelReader != null) excelReader.Close();
                }
            }

            return ds;
        }
    }

}