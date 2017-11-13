using System.Collections.Generic;
using System.IO;
using System.Linq;
using ANBR.Common.Contarcts;
using ANBR.SAMetaModel;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.DictionaryService.Contracts;
using ANBR.SemanticArchive.DataContracts;
using System.Data;
using System;
using System.Drawing;
using System.Drawing.Imaging;

namespace www.SaGateway
{
    public class ImportFromExcel
    {
        private ANBR.SemanticArchive.SDK.IDataBase _datawarehouse => WebSaUtilities.Database;

        bool IsValid(DataSet ds, out string validationError)
        {
            validationError = "";
            bool isValid = true;
            foreach (DataTable table in ds.Tables)
            {
                string sysTypeName = table.TableName;
                IMetaType metatype = _datawarehouse.MetaModel.MetaTypes.TryGetByName(sysTypeName);
                if (metatype == null) continue;

                bool hasDisplayName = false;
                foreach (DataColumn col in table.Columns)
                {
                    if (col.ColumnName.ToLower() == "display_name")
                        hasDisplayName = true;

                    isValid &= hasDisplayName;
                    validationError += String.Format("Тип \"{0}\"cвойство \"Display_Name\" - обязательно для заполнения", sysTypeName) + Environment.NewLine;
                }
            }

            return isValid;
        }

        public List<int> _createdObjects = new List<int>();
        public List<int> CreatedObjects { get { return _createdObjects; } }

        string _fileName;
        public bool Execute(string fileName)
        {
            //TODO: Ограничение. Справочные свойства и многозначные только строковые (для поддержки остальных типов требуется доработка)
            _fileName = fileName;

            try
            {
                DataSet ds = null;
                try
                {
                    ds = ExcelHelper.ExportToDataset(fileName);
                }
                catch
                {
                    throw new ApplicationException("Возникли проблемы с получением данных из документа. Возможная проблема - документ открыт. Закройте, пожалуйста, документ перед выполнением импорта.");
                }

                string validationError;
                if (!IsValid(ds, out validationError))
                    throw new ApplicationException("Документ не прошел проверку. Обнаружены следующие ошибки:" + validationError);


                foreach (DataTable table in ds.Tables)
                {
                    List<string> columnsList = new List<string>();
                    foreach (DataColumn item in table.Columns)
                        columnsList.Add(item.ColumnName);

                    string sysTypeName = table.TableName;
                    IMetaType metatype = _datawarehouse.MetaModel.MetaTypes.TryGetByName(sysTypeName);
                    if (metatype == null) continue;

                    List<MetaProperty> metaProperties = GetProperties(metatype.ID, columnsList);
                    var simpleProps = metaProperties.Where(mp => (mp.Dictionary == null && !mp.IsMultiVal && mp.SystemName != "Display_Name" && mp.SystemName != "Image")).ToList();
                    var multiSimpleProps = metaProperties.Where(mp => (mp.Dictionary == null && mp.IsMultiVal)).ToList();
                    var dicProps = metaProperties.Where(mp => (mp.Dictionary != null)).ToList();
                    var imageProp = metaProperties.Where(mp => mp.SystemName == "Image").FirstOrDefault();
                    bool hasRubrics = table.Columns.Contains("Rubrics");

                    List<ANBR.SemanticArchive.DataContracts.Rubric> rubrics = _datawarehouse.ObjectService.GetAllRubrics();

                    foreach (DataRow row in table.Rows)
                    {
                        ANBR.SemanticArchive.DataContracts.DataObject obj = new ANBR.SemanticArchive.DataContracts.DataObject();
                        obj.Type_ID = metatype.ID;
                        obj.ObjectStatus = 0;

                        obj.Display_Name = row.Field<string>("Display_Name");
                        if (imageProp != null)
                        {
                            byte[] imgArr = (byte[])GetTypedValue(imageProp, row);
                            if (imgArr != null)
                                obj.Image = imgArr;
                        }

                        int objectID = _datawarehouse.ObjectService.CreateObject(obj);
                        _createdObjects.Add(objectID);

                        #region Рубрики
                        if (hasRubrics)
                        {
                            string path = row.Field<string>("Rubrics");
                            foreach (string rubricItem in path.Split(new char[] { ';' }, StringSplitOptions.RemoveEmptyEntries))
                            {
                                var pathSplited = rubricItem.Split(new char[] { '/', '\\' }, StringSplitOptions.RemoveEmptyEntries).Select(item => item.Trim()).ToArray();
                                Rubric linkToRubric = ProcessPath(pathSplited, rubrics);
                                _datawarehouse.ObjectService.AddRubricToObject(objectID, linkToRubric.ID);
                            }
                        }
                        #endregion

                        #region Прострые свойств
                        foreach (MetaProperty prop in simpleProps)
                        {
                            object value = GetTypedValue(prop, row);
                            if (value != null)
                                _datawarehouse.ObjectService.UpdatePropValue(objectID, prop.AsDMetaProperty(), new object[] { value });
                        }
                        #endregion

                        #region Простые многозначные
                        foreach (MetaProperty prop in multiSimpleProps)
                        {
                            string value = (String)GetTypedValue(prop, row);
                            if (value != null)
                            {
                                var separatedValues = value.Split(',', ';');
                                foreach (string sv in separatedValues)
                                    _datawarehouse.ObjectService.UpdatePropValue(objectID, prop.AsDMetaProperty(), new object[] { sv });
                            }
                        }
                        #endregion

                        #region Справочные
                        foreach (MetaProperty prop in dicProps)
                        {
                            string value = (String)GetTypedValue(prop, row);
                            if (value != null)
                            {
                                var separatedValues = value.Split(',', ';');
                                foreach (string sv in separatedValues)
                                {
                                    DataTable data = _datawarehouse. DictionaryService.ReadDictionaryRecords(prop.MetaDictionary_ID);
                                    DataRow foundRow = data.AsEnumerable().Where(item => item.Field<string>("DisplayName").ToLower() == sv.ToLower()).FirstOrDefault();
                                    if (foundRow != null)
                                    {
                                        _datawarehouse.ObjectService.UpdatePropValue(objectID, prop.AsDMetaProperty(), new object[] { foundRow.Field<int>("IdRecord") });
                                    }
                                    else
                                    {
                                        DictionaryValue dv = new DictionaryValue();
                                        dv.IdDictionary = prop.MetaDictionary_ID;
                                        dv.DisplayName = sv;
                                        dv.Deleted = false;

                                        int newID = -1;
                                        _datawarehouse.DictionaryService.AddNewDictionaryRecordOutputId(dv, ref newID);
                                        if (newID > 0)
                                        {
                                            _datawarehouse.ObjectService.UpdatePropValue(objectID, prop.AsDMetaProperty(), new object[] { newID });
                                        }
                                    }
                                }
                            }
                        }
                        #endregion
                    }
                }

                return true;
            }
            catch (ArgumentException)
            {
                throw new ApplicationException("Ошибка формата данных " + fileName);
            }
        }

        private Rubric ProcessPath(string[] pathSplited, List<ANBR.SemanticArchive.DataContracts.Rubric> rubrics)
        {
            Rubric rubric = null;
            for (int i = 0; i < pathSplited.Length; i++)
            {
                if (i == 0)
                {
                    rubric = rubrics.Where(item => item.Name.ToLower() == pathSplited[i].ToLower()).FirstOrDefault();

                    if (rubric == null)
                    {
                        rubric = new Rubric();
                        rubric.Name = pathSplited[i];
                        rubric.Parent_ID = 0;

                        int newID = _datawarehouse.ObjectService.AddRubric(rubric);
                        rubric.ID = newID;
                        rubrics.Add(rubric);
                    }

                    continue;
                }

                var rubricCurrent = rubrics.FirstOrDefault(item => item.Name.ToLower() == pathSplited[i].ToLower() && item.Parent_ID == rubric.ID);
                if (rubricCurrent != null)
                {
                    rubric = rubricCurrent;
                    continue;
                }

                rubricCurrent = new Rubric();
                rubricCurrent.Name = pathSplited[i];
                rubricCurrent.Parent_ID = rubric.ID;

                int newID2 = _datawarehouse.ObjectService.AddRubric(rubricCurrent);
                rubric = rubricCurrent;
                rubric.ID = newID2;
                rubrics.Add(rubric);
            }

            return rubric;
        }

        private object GetTypedValue(MetaProperty prop, DataRow row)
        {
            switch (prop.PropType)
            {
                case PropertyType.Integer:
                    {
                        if (row[prop.SystemName] == DBNull.Value) return null;

                        try
                        {
                            return Convert.ToInt32(row[prop.SystemName]);
                        }
                        catch
                        {
                            return null;
                        }
                    }
                case PropertyType.Text:
                case PropertyType.String:
                    {
                        if (row[prop.SystemName] == DBNull.Value) return null;

                        string val = row[prop.SystemName].ToString();
                        if (String.IsNullOrWhiteSpace(val)) return null;
                        return val;
                    }
                case PropertyType.Dictionary:
                    {
                        if (row[prop.SystemName] == DBNull.Value) return null;

                        string val = row[prop.SystemName].ToString();
                        if (String.IsNullOrWhiteSpace(val)) return null;
                        return val;
                    }
                case PropertyType.DateTime:
                    {
                        if (row[prop.SystemName] == DBNull.Value) return null;
                        try
                        {
                            return Convert.ToDateTime(row[prop.SystemName]);
                        }
                        catch
                        {
                            return null;
                        }
                    }
                case PropertyType.Picture:
                    {
                        if (prop.SystemName == "Image")
                        {
                            if (row[prop.SystemName] == DBNull.Value) return null;

                            string relativeFileName = row[prop.SystemName].ToString();
                            if (String.IsNullOrWhiteSpace(relativeFileName)) return null;

                            string fileName = Path.Combine(Path.GetDirectoryName(_fileName), relativeFileName);
                            if (!File.Exists(fileName)) return null;

                            using (Image img = Image.FromFile(fileName))
                            using (MemoryStream ms = new MemoryStream())
                            {
                                img.Save(ms, ImageFormat.Jpeg);
                                return ms.ToArray();
                            }
                        }
                        break;
                    }
            }

            throw new InvalidOperationException();
        }

        List<MetaProperty> GetProperties(int typeID, List<string> columns)
        {
            List<MetaProperty> propList = new List<MetaProperty>();
            foreach (string col in columns)
            {
                MetaProperty mp = null;
                try
                {
                    mp = (MetaProperty)_datawarehouse.MetaModel.MetaProperties.TryGetByName(col);
                }
                catch { }
                if (mp == null) continue;

                propList.Add(mp);
            }

            return propList;
        }
    }

}