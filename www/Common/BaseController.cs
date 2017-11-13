using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using Anbr.Web.SA.CoreLogic;
using www.Models;
using ANBR.Common.Contracts;
using ANBR.SemanticArchive.SDK;
using www.SaGateway;

namespace www.Controllers
{

#if (RELEASE_IS || DEBUG)
    [Authorize]
#endif
    public class BaseController : Controller
    {
        enum UIKind
        {
            None,
            DBMain,
            AutoDosier,
            ReadOnly,
            DeepInternet,
            AutoDosier_Monitoring,
            Monitoring
        }

        static string[] GetChangeingStateElements()
        {
            #region ids
            return new[]
                             {
"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
                             };
            #endregion
        }

        static string[] GetUIKind(UIKind kind)
        {
            string area = "";
            if (System.Web.HttpContext.Current.Request.RequestContext.RouteData.DataTokens.ContainsKey("area"))
                area = System.Web.HttpContext.Current.Request.RequestContext.RouteData.DataTokens["area"].ToString();
            if (area.ToLower() == "wall")
            {
                var wallSecItems = new List<string>
                {
                    "FE195E4A-CAAD-4987-A1E8-2788F1796F95", // информационная панель отображающая информацию по доступу
                    "0CA650F2-8D85-4C76-8B02-F4080F75B9DE", // кнопка у источника "показать оригинал документа"
                    "5C949741-9B72-40EA-AAA6-6FD4419C6E86", // кнопка у источника "перевести"
                    "5C949741-9B72-40EA-AAA6-6FD4419C6E86", // кнопка у источника "вернуть оригинал"
                    "73FCB91F-2E99-4BF7-857F-F3EB59610AFE", // кнопка у источника режима показа
                    "4E38E1F4-38D5-40B5-AAAD-CCE5825100AD", // кнопка у источника "показать семантическую сеть"
                    // -------------- wall
                };

#if (RELEASE_IS || DEBUG)
                wallSecItems.Add("CB8161D1-C672-4826-BC7E-F9CB559D72F6");   //	11.1		кнопка "Расшарить"
#endif
                return wallSecItems.ToArray();
            }


            switch (kind)
            {
                case UIKind.DBMain:
                    #region ids
                    return new[]
                             {
"94965912-2822-4ABD-85C5-CE4C5BD7FB66",//	1. 			панель запросов (набор кнопок)
"5A09B332-1187-46D1-A258-007EE11C10EE",//	2. 			панель результов поиска
"2EDB7494-2163-4D32-8FF0-375C19353AC4",//	3. 			панель детализации объекта
"B284E232-7316-42B7-90D9-50F24637B0F1",//	4. 			представление страницы (две колонки, три колонки и т.д.)
"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
"A9E96399-21B4-4F4D-8A0B-91998B1E6C1A",//	6. 			корзина
"E6324295-2B83-4D13-BE3B-DF6A18DEB193",//	7. 			панель сообщений
"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FE195E4A-CAAD-4987-A1E8-2788F1796F95",//   9.          информационная панель отображающая информацию по доступу
"44ECE076-7C41-4DE9-BF60-73424F68FD07",//	10.			кнопка "Импорт из Excel"
"8F245833-3A60-48E8-B355-9B5D7F0D1F8E",//	1.0 		Кнопка Все
"7394472E-5A66-486B-966C-EBF2559A5E90",//	1.1 		дерево типов
"F1002763-7AF9-44F8-821C-D1DBA0F21241",//	1.2 		глобальный поиск
"C0E6244C-A4CC-42C2-962D-A4A9525DAB6A",//	1.2.1 		кнопка "найти"
"DAA516B4-3BB5-48D4-93FB-6673AC7654B2",//	1.2.2 		набор параметров поиска (поле ввода текста, фильтр по типам)
"5F7DD647-2053-421B-884B-B9641DDDD442",//	1.3 		запросы
"D7FBDE6D-D26C-4567-950B-DB82219A7F46",//	1.3.1 		редактор запросов 	
"0F40C587-27EC-4C87-AD2B-18D0B214CB9F",//	1.3.1.1 	кнопка "выполнить запрос"
"AE817F7F-7657-4DF2-886C-6E9FBA304D95",//	1.3.1.2 	набор параметров запроса
"FE4934B0-C457-4EC6-9429-79FD656964AE",//	1.4 		рубрики
"81E00BFB-0E71-4EA6-8CCF-6FEAE466D5F5",//	1.4.1 		панель инструментов для упралением рубкикой
"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"5146D1D1-C2E2-445E-87B5-44FB73C6F7C2",//	1.4.1.4 	кнопка "очистить"
//"EA632ED2-F3B3-41E8-9BA7-B5CD6FA8D5A9",//	1.5			мониторинг
"D3DFA5F5-F831-4397-BB1F-650471FA048A",//	2.1 		панель переключения отображения результатов поиска
"0CA650F2-8D85-4C76-8B02-F4080F75B9DE",//	3.0.1		кнопка показать оригинал документа
"FBB44316-1A0C-450A-8DC6-A1D10F560C01",//	3.1 		свойства объекта
"E641426A-B86A-48F0-A8D9-D1CEC88B896C",//	3.2 		семантическая сеть
"E7087740-A79F-493C-8B46-77BDBB8EA74E",//	3.3 		содержимое 
//"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"5C949741-9B72-40EA-AAA6-6FD4419C6E86",//	3.3.2		кнопка перевести
"6782E40B-794A-467D-BC8E-21992920317D",//	3.3.3		кнопка перерейти к резултатам поиска
"73FCB91F-2E99-4BF7-857F-F3EB59610AFE",//	3.3.4		кнопка переключения вида содержимого
"AD694BFD-4983-4658-ABDD-D6863BB80F71",//	3.4 		отчет
//"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
"EB057E3E-A2F1-41F0-8591-BCAABC9B09D9",//	3.6 		документы
"9237CCBA-3A1B-480C-BCD8-F72994B0C3F9",//	3.7 		факты
"FBC39B1C-6401-42B8-B3E2-5E859CF0DBBD",//	3.8 		оригинал документа
"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"CEA8253E-4EE0-4825-BB15-91BA09F9992E",//	3.8.2		ссылка на скачивание файла оригинала
"78EE4AC9-CB6C-440B-8C77-89A02131B273",//	3.9			выписки
"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
"FC8E4A90-73BE-4114-BDE7-6D2FB5969CAF",//	8.4 		история просмотра
"B7787886-AF0E-4B5A-9061-49B182200B8C",//	8.5 		добавить в корзину
"7460E56F-62BD-4C9D-A8E5-5B64373C5131",//	10.0		изменить статус в заявках
"C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",//	10.1		добавить фрагмент
                             };
                #endregion
                case UIKind.Monitoring:
                    #region ids
                    return new[]
                             {
"94965912-2822-4ABD-85C5-CE4C5BD7FB66",//	1. 			панель запросов (набор кнопок)
"5A09B332-1187-46D1-A258-007EE11C10EE",//	2. 			панель результов поиска
"2EDB7494-2163-4D32-8FF0-375C19353AC4",//	3. 			панель детализации объекта
"B284E232-7316-42B7-90D9-50F24637B0F1",//	4. 			представление страницы (две колонки, три колонки и т.д.)
"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
"A9E96399-21B4-4F4D-8A0B-91998B1E6C1A",//	6. 			корзина
"E6324295-2B83-4D13-BE3B-DF6A18DEB193",//	7. 			панель сообщений
"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FE195E4A-CAAD-4987-A1E8-2788F1796F95",//   9.          информационная панель отображающая информацию по доступу
"44ECE076-7C41-4DE9-BF60-73424F68FD07",//	10.			кнопка "Импорт из Excel"
"8F245833-3A60-48E8-B355-9B5D7F0D1F8E",//	1.0 		Кнопка Все
"7394472E-5A66-486B-966C-EBF2559A5E90",//	1.1 		дерево типов
"F1002763-7AF9-44F8-821C-D1DBA0F21241",//	1.2 		глобальный поиск
"C0E6244C-A4CC-42C2-962D-A4A9525DAB6A",//	1.2.1 		кнопка "найти"
"DAA516B4-3BB5-48D4-93FB-6673AC7654B2",//	1.2.2 		набор параметров поиска (поле ввода текста, фильтр по типам)
"5F7DD647-2053-421B-884B-B9641DDDD442",//	1.3 		запросы
"D7FBDE6D-D26C-4567-950B-DB82219A7F46",//	1.3.1 		редактор запросов 	
"0F40C587-27EC-4C87-AD2B-18D0B214CB9F",//	1.3.1.1 	кнопка "выполнить запрос"
"AE817F7F-7657-4DF2-886C-6E9FBA304D95",//	1.3.1.2 	набор параметров запроса
"FE4934B0-C457-4EC6-9429-79FD656964AE",//	1.4 		рубрики
"81E00BFB-0E71-4EA6-8CCF-6FEAE466D5F5",//	1.4.1 		панель инструментов для упралением рубкикой
"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"5146D1D1-C2E2-445E-87B5-44FB73C6F7C2",//	1.4.1.4 	кнопка "очистить"
"EA632ED2-F3B3-41E8-9BA7-B5CD6FA8D5A9",//	1.5			мониторинг
"D3DFA5F5-F831-4397-BB1F-650471FA048A",//	2.1 		панель переключения отображения результатов поиска
"0CA650F2-8D85-4C76-8B02-F4080F75B9DE",//	3.0.1		кнопка показать оригинал документа
"FBB44316-1A0C-450A-8DC6-A1D10F560C01",//	3.1 		свойства объекта
"E641426A-B86A-48F0-A8D9-D1CEC88B896C",//	3.2 		семантическая сеть
"E7087740-A79F-493C-8B46-77BDBB8EA74E",//	3.3 		содержимое 
//"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"5C949741-9B72-40EA-AAA6-6FD4419C6E86",//	3.3.2		кнопка перевести
"6782E40B-794A-467D-BC8E-21992920317D",//	3.3.3		кнопка перерейти к резултатам поиска
"73FCB91F-2E99-4BF7-857F-F3EB59610AFE",//	3.3.4		кнопка переключения вида содержимого
"AD694BFD-4983-4658-ABDD-D6863BB80F71",//	3.4 		отчет
//"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
"EB057E3E-A2F1-41F0-8591-BCAABC9B09D9",//	3.6 		документы
"9237CCBA-3A1B-480C-BCD8-F72994B0C3F9",//	3.7 		факты
"FBC39B1C-6401-42B8-B3E2-5E859CF0DBBD",//	3.8 		оригинал документа
"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"CEA8253E-4EE0-4825-BB15-91BA09F9992E",//	3.8.2		ссылка на скачивание файла оригинала
"78EE4AC9-CB6C-440B-8C77-89A02131B273",//	3.9			выписки
"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
"FC8E4A90-73BE-4114-BDE7-6D2FB5969CAF",//	8.4 		история просмотра
"B7787886-AF0E-4B5A-9061-49B182200B8C",//	8.5 		добавить в корзину
"7460E56F-62BD-4C9D-A8E5-5B64373C5131",//	10.0		изменить статус в заявках
"C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",//	10.1		добавить фрагмент
                             };
                #endregion
                case UIKind.AutoDosier:
                    #region ids
                    return new[]
                             {
"94965912-2822-4ABD-85C5-CE4C5BD7FB66",//	1. 			панель запросов (набор кнопок)
"5A09B332-1187-46D1-A258-007EE11C10EE",//	2. 			панель результов поиска
"2EDB7494-2163-4D32-8FF0-375C19353AC4",//	3. 			панель детализации объекта
"B284E232-7316-42B7-90D9-50F24637B0F1",//	4. 			представление страницы (две колонки, три колонки и т.д.)
"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
"A9E96399-21B4-4F4D-8A0B-91998B1E6C1A",//	6. 			корзина
"E6324295-2B83-4D13-BE3B-DF6A18DEB193",//	7. 			панель сообщений
"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FE195E4A-CAAD-4987-A1E8-2788F1796F95",//   9.          информационная панель отображающая информацию по доступу
"44ECE076-7C41-4DE9-BF60-73424F68FD07",//	10.			кнопка "Импорт из Excel"
"8F245833-3A60-48E8-B355-9B5D7F0D1F8E",//	1.0 		Кнопка Все
"7394472E-5A66-486B-966C-EBF2559A5E90",//	1.1 		дерево типов
"F1002763-7AF9-44F8-821C-D1DBA0F21241",//	1.2 		глобальный поиск
"C0E6244C-A4CC-42C2-962D-A4A9525DAB6A",//	1.2.1 		кнопка "найти"
"DAA516B4-3BB5-48D4-93FB-6673AC7654B2",//	1.2.2 		набор параметров поиска (поле ввода текста, фильтр по типам)
"5F7DD647-2053-421B-884B-B9641DDDD442",//	1.3 		запросы
"D7FBDE6D-D26C-4567-950B-DB82219A7F46",//	1.3.1 		редактор запросов 	
"0F40C587-27EC-4C87-AD2B-18D0B214CB9F",//	1.3.1.1 	кнопка "выполнить запрос"
"AE817F7F-7657-4DF2-886C-6E9FBA304D95",//	1.3.1.2 	набор параметров запроса
"FE4934B0-C457-4EC6-9429-79FD656964AE",//	1.4 		рубрики
"81E00BFB-0E71-4EA6-8CCF-6FEAE466D5F5",//	1.4.1 		панель инструментов для упралением рубкикой
"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"5146D1D1-C2E2-445E-87B5-44FB73C6F7C2",//	1.4.1.4 	кнопка "очистить"
//"EA632ED2-F3B3-41E8-9BA7-B5CD6FA8D5A9",//	1.5			мониторинг
"D3DFA5F5-F831-4397-BB1F-650471FA048A",//	2.1 		панель переключения отображения результатов поиска
"0CA650F2-8D85-4C76-8B02-F4080F75B9DE",//	3.0.1		кнопка показать оригинал документа
"FBB44316-1A0C-450A-8DC6-A1D10F560C01",//	3.1 		свойства объекта
"E641426A-B86A-48F0-A8D9-D1CEC88B896C",//	3.2 		семантическая сеть
"E7087740-A79F-493C-8B46-77BDBB8EA74E",//	3.3 		содержимое 
//"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"5C949741-9B72-40EA-AAA6-6FD4419C6E86",//	3.3.2		кнопка перевести
"6782E40B-794A-467D-BC8E-21992920317D",//	3.3.3		кнопка перерейти к резултатам поиска
"73FCB91F-2E99-4BF7-857F-F3EB59610AFE",//	3.3.4		кнопка переключения вида содержимого
"AD694BFD-4983-4658-ABDD-D6863BB80F71",//	3.4 		отчет
"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
"EB057E3E-A2F1-41F0-8591-BCAABC9B09D9",//	3.6 		документы
"9237CCBA-3A1B-480C-BCD8-F72994B0C3F9",//	3.7 		факты
"FBC39B1C-6401-42B8-B3E2-5E859CF0DBBD",//	3.8 		оригинал документа
"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"CEA8253E-4EE0-4825-BB15-91BA09F9992E",//	3.8.2		ссылка на скачивание файла оригинала
"78EE4AC9-CB6C-440B-8C77-89A02131B273",//	3.9			выписки
"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
"FC8E4A90-73BE-4114-BDE7-6D2FB5969CAF",//	8.4 		история просмотра
"B7787886-AF0E-4B5A-9061-49B182200B8C",//	8.5 		добавить в корзину
"7460E56F-62BD-4C9D-A8E5-5B64373C5131",//	10.0		изменить статус в заявках
"C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",//	10.1		добавить фрагмент
                             };
                #endregion
                case UIKind.AutoDosier_Monitoring:
                    #region ids
                    return new[]
                             {
"94965912-2822-4ABD-85C5-CE4C5BD7FB66",//	1. 			панель запросов (набор кнопок)
"5A09B332-1187-46D1-A258-007EE11C10EE",//	2. 			панель результов поиска
"2EDB7494-2163-4D32-8FF0-375C19353AC4",//	3. 			панель детализации объекта
"B284E232-7316-42B7-90D9-50F24637B0F1",//	4. 			представление страницы (две колонки, три колонки и т.д.)
"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
"A9E96399-21B4-4F4D-8A0B-91998B1E6C1A",//	6. 			корзина
"E6324295-2B83-4D13-BE3B-DF6A18DEB193",//	7. 			панель сообщений
"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FE195E4A-CAAD-4987-A1E8-2788F1796F95",//   9.          информационная панель отображающая информацию по доступу
"44ECE076-7C41-4DE9-BF60-73424F68FD07",//	10.			кнопка "Импорт из Excel"
"8F245833-3A60-48E8-B355-9B5D7F0D1F8E",//	1.0 		Кнопка Все
"7394472E-5A66-486B-966C-EBF2559A5E90",//	1.1 		дерево типов
"F1002763-7AF9-44F8-821C-D1DBA0F21241",//	1.2 		глобальный поиск
"C0E6244C-A4CC-42C2-962D-A4A9525DAB6A",//	1.2.1 		кнопка "найти"
"DAA516B4-3BB5-48D4-93FB-6673AC7654B2",//	1.2.2 		набор параметров поиска (поле ввода текста, фильтр по типам)
"5F7DD647-2053-421B-884B-B9641DDDD442",//	1.3 		запросы
"D7FBDE6D-D26C-4567-950B-DB82219A7F46",//	1.3.1 		редактор запросов 	
"0F40C587-27EC-4C87-AD2B-18D0B214CB9F",//	1.3.1.1 	кнопка "выполнить запрос"
"AE817F7F-7657-4DF2-886C-6E9FBA304D95",//	1.3.1.2 	набор параметров запроса
"FE4934B0-C457-4EC6-9429-79FD656964AE",//	1.4 		рубрики
"81E00BFB-0E71-4EA6-8CCF-6FEAE466D5F5",//	1.4.1 		панель инструментов для упралением рубкикой
"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"5146D1D1-C2E2-445E-87B5-44FB73C6F7C2",//	1.4.1.4 	кнопка "очистить"
"EA632ED2-F3B3-41E8-9BA7-B5CD6FA8D5A9",//	1.5			мониторинг
"D3DFA5F5-F831-4397-BB1F-650471FA048A",//	2.1 		панель переключения отображения результатов поиска
"0CA650F2-8D85-4C76-8B02-F4080F75B9DE",//	3.0.1		кнопка показать оригинал документа
"FBB44316-1A0C-450A-8DC6-A1D10F560C01",//	3.1 		свойства объекта
"E641426A-B86A-48F0-A8D9-D1CEC88B896C",//	3.2 		семантическая сеть
"E7087740-A79F-493C-8B46-77BDBB8EA74E",//	3.3 		содержимое 
//"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"5C949741-9B72-40EA-AAA6-6FD4419C6E86",//	3.3.2		кнопка перевести
"6782E40B-794A-467D-BC8E-21992920317D",//	3.3.3		кнопка перерейти к резултатам поиска
"73FCB91F-2E99-4BF7-857F-F3EB59610AFE",//	3.3.4		кнопка переключения вида содержимого
"AD694BFD-4983-4658-ABDD-D6863BB80F71",//	3.4 		отчет
"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
"EB057E3E-A2F1-41F0-8591-BCAABC9B09D9",//	3.6 		документы
"9237CCBA-3A1B-480C-BCD8-F72994B0C3F9",//	3.7 		факты
"FBC39B1C-6401-42B8-B3E2-5E859CF0DBBD",//	3.8 		оригинал документа
"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"CEA8253E-4EE0-4825-BB15-91BA09F9992E",//	3.8.2		ссылка на скачивание файла оригинала
"78EE4AC9-CB6C-440B-8C77-89A02131B273",//	3.9			выписки
"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
"FC8E4A90-73BE-4114-BDE7-6D2FB5969CAF",//	8.4 		история просмотра
"B7787886-AF0E-4B5A-9061-49B182200B8C",//	8.5 		добавить в корзину
"7460E56F-62BD-4C9D-A8E5-5B64373C5131",//	10.0		изменить статус в заявках
"C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",//	10.1		добавить фрагмент
                             };
                #endregion
                case UIKind.ReadOnly:
                    #region ids
                    return new[]
                             {
"94965912-2822-4ABD-85C5-CE4C5BD7FB66",//	1. 			панель запросов (набор кнопок)
"5A09B332-1187-46D1-A258-007EE11C10EE",//	2. 			панель результов поиска
"2EDB7494-2163-4D32-8FF0-375C19353AC4",//	3. 			панель детализации объекта
"B284E232-7316-42B7-90D9-50F24637B0F1",//	4. 			представление страницы (две колонки, три колонки и т.д.)
//"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
"A9E96399-21B4-4F4D-8A0B-91998B1E6C1A",//	6. 			корзина
"E6324295-2B83-4D13-BE3B-DF6A18DEB193",//	7. 			панель сообщений
//"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FE195E4A-CAAD-4987-A1E8-2788F1796F95",//   9.          информационная панель отображающая информацию по доступу
"44ECE076-7C41-4DE9-BF60-73424F68FD07",//	10.			кнопка "Импорт из Excel"
"8F245833-3A60-48E8-B355-9B5D7F0D1F8E",//	1.0 		Кнопка Все
"7394472E-5A66-486B-966C-EBF2559A5E90",//	1.1 		дерево типов
"F1002763-7AF9-44F8-821C-D1DBA0F21241",//	1.2 		глобальный поиск
"C0E6244C-A4CC-42C2-962D-A4A9525DAB6A",//	1.2.1 		кнопка "найти"
"DAA516B4-3BB5-48D4-93FB-6673AC7654B2",//	1.2.2 		набор параметров поиска (поле ввода текста, фильтр по типам)
"5F7DD647-2053-421B-884B-B9641DDDD442",//	1.3 		запросы
"D7FBDE6D-D26C-4567-950B-DB82219A7F46",//	1.3.1 		редактор запросов 	
"0F40C587-27EC-4C87-AD2B-18D0B214CB9F",//	1.3.1.1 	кнопка "выполнить запрос"
"AE817F7F-7657-4DF2-886C-6E9FBA304D95",//	1.3.1.2 	набор параметров запроса
"FE4934B0-C457-4EC6-9429-79FD656964AE",//	1.4 		рубрики
"81E00BFB-0E71-4EA6-8CCF-6FEAE466D5F5",//	1.4.1 		панель инструментов для упралением рубкикой
//"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
//"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
//"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"5146D1D1-C2E2-445E-87B5-44FB73C6F7C2",//	1.4.1.4 	кнопка "очистить"
"EA632ED2-F3B3-41E8-9BA7-B5CD6FA8D5A9",//	1.5			мониторинг
"D3DFA5F5-F831-4397-BB1F-650471FA048A",//	2.1 		панель переключения отображения результатов поиска
"0CA650F2-8D85-4C76-8B02-F4080F75B9DE",//	3.0.1		кнопка показать оригинал документа
"FBB44316-1A0C-450A-8DC6-A1D10F560C01",//	3.1 		свойства объекта
"E641426A-B86A-48F0-A8D9-D1CEC88B896C",//	3.2 		семантическая сеть
"E7087740-A79F-493C-8B46-77BDBB8EA74E",//	3.3 		содержимое 
//"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"5C949741-9B72-40EA-AAA6-6FD4419C6E86",//	3.3.2		кнопка перевести
"6782E40B-794A-467D-BC8E-21992920317D",//	3.3.3		кнопка перерейти к резултатам поиска
"73FCB91F-2E99-4BF7-857F-F3EB59610AFE",//	3.3.4		кнопка переключения вида содержимого
"AD694BFD-4983-4658-ABDD-D6863BB80F71",//	3.4 		отчет
//"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
"EB057E3E-A2F1-41F0-8591-BCAABC9B09D9",//	3.6 		документы
"9237CCBA-3A1B-480C-BCD8-F72994B0C3F9",//	3.7 		факты
"FBC39B1C-6401-42B8-B3E2-5E859CF0DBBD",//	3.8 		оригинал документа
//"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"CEA8253E-4EE0-4825-BB15-91BA09F9992E",//	3.8.2		ссылка на скачивание файла оригинала
"78EE4AC9-CB6C-440B-8C77-89A02131B273",//	3.9			выписки
//"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
//"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
//"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
//"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
//"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
//"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
//"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
"FC8E4A90-73BE-4114-BDE7-6D2FB5969CAF",//	8.4 		история просмотра
"B7787886-AF0E-4B5A-9061-49B182200B8C",//	8.5 		добавить в корзину
"7460E56F-62BD-4C9D-A8E5-5B64373C5131",//	10.0		изменить статус в заявках
"C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",//	10.1		добавить фрагмент
                             };
                #endregion
                case UIKind.DeepInternet:
                    #region ids
                    return new[]
                             {
"94965912-2822-4ABD-85C5-CE4C5BD7FB66",//	1. 			панель запросов (набор кнопок)
"5A09B332-1187-46D1-A258-007EE11C10EE",//	2. 			панель результов поиска
"2EDB7494-2163-4D32-8FF0-375C19353AC4",//	3. 			панель детализации объекта
"B284E232-7316-42B7-90D9-50F24637B0F1",//	4. 			представление страницы (две колонки, три колонки и т.д.)
//"2C7B82CF-37FE-4B6E-9166-6B191AE1E703",//	5. 			панель добавления объектов (тулбар вверху)
//"A9E96399-21B4-4F4D-8A0B-91998B1E6C1A",//	6. 			корзина
//"E6324295-2B83-4D13-BE3B-DF6A18DEB193",//	7. 			панель сообщений
//"E0BEFD51-6632-415A-A30C-D8A5314DF7C5",//	8. 			правая панель инструментов
"FE195E4A-CAAD-4987-A1E8-2788F1796F95",//   9.          информационная панель отображающая информацию по доступу
"44ECE076-7C41-4DE9-BF60-73424F68FD07",//	10.			кнопка "Импорт из Excel"
"8F245833-3A60-48E8-B355-9B5D7F0D1F8E",//	1.0 		Кнопка Все
//"7394472E-5A66-486B-966C-EBF2559A5E90",//	1.1 		дерево типов
//"F1002763-7AF9-44F8-821C-D1DBA0F21241",//	1.2 		глобальный поиск
//"C0E6244C-A4CC-42C2-962D-A4A9525DAB6A",//	1.2.1 		кнопка "найти"
//"DAA516B4-3BB5-48D4-93FB-6673AC7654B2",//	1.2.2 		набор параметров поиска (поле ввода текста, фильтр по типам)
//"5F7DD647-2053-421B-884B-B9641DDDD442",//	1.3 		запросы
//"D7FBDE6D-D26C-4567-950B-DB82219A7F46",//	1.3.1 		редактор запросов 	
"0F40C587-27EC-4C87-AD2B-18D0B214CB9F",//	1.3.1.1 	кнопка "выполнить запрос"
"AE817F7F-7657-4DF2-886C-6E9FBA304D95",//	1.3.1.2 	набор параметров запроса
"FE4934B0-C457-4EC6-9429-79FD656964AE",//	1.4 		рубрики
"81E00BFB-0E71-4EA6-8CCF-6FEAE466D5F5",//	1.4.1 		панель инструментов для упралением рубкикой
//"FB0AB23A-36D0-4A5C-8706-00A3DB9BCFAE",//	1.4.1.1 	кнопка "создать рубрику"
//"C90535CA-D9E3-445A-AF3D-066066484755",//	1.4.1.2 	кнопка "удалить рубрику"
//"5A0C0FC1-E1A6-4E52-B784-0F98795FAD1A",//	1.4.1.3 	кнопка "переименовать (изменинть) рубрику
"5146D1D1-C2E2-445E-87B5-44FB73C6F7C2",//	1.4.1.4 	кнопка "очистить"
//"EA632ED2-F3B3-41E8-9BA7-B5CD6FA8D5A9",//	1.5			мониторинг
"D3DFA5F5-F831-4397-BB1F-650471FA048A",//	2.1 		панель переключения отображения результатов поиска
"0CA650F2-8D85-4C76-8B02-F4080F75B9DE",//	3.0.1		кнопка показать оригинал документа
"FBB44316-1A0C-450A-8DC6-A1D10F560C01",//	3.1 		свойства объекта
//"E641426A-B86A-48F0-A8D9-D1CEC88B896C",//	3.2 		семантическая сеть
"E7087740-A79F-493C-8B46-77BDBB8EA74E",//	3.3 		содержимое 
//"4E38E1F4-38D5-40B5-AAAD-CCE5825100AD",//	3.3.1		кнопка показать семантическую сеть
"5C949741-9B72-40EA-AAA6-6FD4419C6E86",//	3.3.2		кнопка перевести
"6782E40B-794A-467D-BC8E-21992920317D",//	3.3.3		кнопка перерейти к резултатам поиска
"73FCB91F-2E99-4BF7-857F-F3EB59610AFE",//	3.3.4		кнопка переключения вида содержимого
//"AD694BFD-4983-4658-ABDD-D6863BB80F71",//	3.4 		отчет
//"EA932373-3647-471A-87C1-DDB56657FEBC",//	3.5 		поиск по источникам
//"EB057E3E-A2F1-41F0-8591-BCAABC9B09D9",//	3.6 		документы
//"9237CCBA-3A1B-480C-BCD8-F72994B0C3F9",//	3.7 		факты
"FBC39B1C-6401-42B8-B3E2-5E859CF0DBBD",//	3.8 		оригинал документа
//"CE669C9B-4E43-4E24-B968-D97679A5A1A0",//	3.8.1		форма загрузки документа (оригинала)
"CEA8253E-4EE0-4825-BB15-91BA09F9992E",//	3.8.2		ссылка на скачивание файла оригинала
"78EE4AC9-CB6C-440B-8C77-89A02131B273",//	3.9			выписки
//"251EE346-BF51-4724-B6F1-29688A231F81",//	4.1 		добавить персону
//"C1644690-426E-4257-9270-4265D9BA2868",//	4.2 		добавить организацию
//"F1A2AB77-7400-4CE6-890B-06B094C2BBEC",//	4.3 		добавить факт
//"A1BE8009-3EE6-4098-850F-9C1814E1A7FD",//	4.4 		добавить документ
//"006D41F9-900A-404D-BF65-5CCDA3445E58",//	8.1 		добавить элемент	
//"8AB272AC-C71A-4C92-83B6-DFFC15E3DF8D",//	8.2 		кнопка "изменить свойства объекта"
//"86056534-0DCB-48CF-B06D-3E8D23FD5001",//	8.3 		кнока "удалить объект"
"FC8E4A90-73BE-4114-BDE7-6D2FB5969CAF",//	8.4 		история просмотра
"B7787886-AF0E-4B5A-9061-49B182200B8C",//	8.5 		добавить в корзину
"7460E56F-62BD-4C9D-A8E5-5B64373C5131",//	10.0		изменить статус в заявках
"C9AB5E2B-2C29-4E22-82CA-CE3FCBE6F8FC",//	10.1		добавить фрагмент
                             };
                #endregion
                default:
                    return new string[0];
            }
        }

        //сюда приходит dbid из адресной строки
        private  GLOBAL_SAModel CalcGlobalView(int dbid, string lang)
        {
            var cgv = CalcGlobalViewInternal(dbid);

            string keyEdgesGetAll = "EdgesGetAll_" + lang;
            var edgeGroups = Helpers.HelperCache.CacheGetOrAdd(keyEdgesGetAll, () =>
            {
                var list = ContentBL.EdgesGetAll();
                foreach (var eg in cgv.Edges)
                    eg.Edges =
                        eg.Edges.Where(item => list.Any(e => e.Code == item.Code && (e.Visible ?? false)))
                            .ToArray();

                return cgv.Edges;
            }, DateTime.UtcNow.AddHours(24), null);

            cgv.Edges = edgeGroups;

            return cgv;
        }

        GLOBAL_SAModel CalcGlobalViewInternal(int dbid)
        {

            int mode = -1;
            string startPoint = "Type";
            var kind = UIKind.None;
            var NetVersion = "Internet";
#if (RELEASE_IS || DEBUG)
            NetVersion = "Intranet";
#endif

            IDataBase saDB = WebSaUtilities.Database;

            int dbTypeInt = 0;
            if (dbid != -1 && saDB != null)
            {
                var dbType = saDB.DatabaseType;
                mode = (int)saDB.ObjectService.GetDatabaseInfo().DatabaseMode;
                dbTypeInt = (int)dbType;

                //IsGlobalShared - это флаг базы на уровне Sa4DatabaseRegistry
                //Данная лозейка позволяет подключаться к базам по прямой ссылке, если самой базы в паспорте пользователя нет
                //Было созданно как временное решение
                string dbName = WebSaUtilities.IsGlobalShared(dbid);
                if (dbName != null && !User.Identity.IsAuthenticated)
                {
                    kind = UIKind.ReadOnly;
                    if ((dbType & DatabaseType.DocumentArchive) == DatabaseType.DocumentArchive)
                    {
                        startPoint = "Rubric";
                        kind = UIKind.DeepInternet;
                    }
                }
                else
                {
                    if (User.Identity.IsAuthenticated)
                    {
                        if ((dbType & DatabaseType.DocumentArchive) == DatabaseType.DocumentArchive)
                        {
                            startPoint = "Rubric";
                            kind = UIKind.DeepInternet;
                        }
                        if ((dbType & DatabaseType.Main) == DatabaseType.Main)
                            kind = UIKind.DBMain;
                        if ((dbType & DatabaseType.AutoDosier) == DatabaseType.AutoDosier)
                            kind = UIKind.AutoDosier;
                        if ((dbType & DatabaseType.Monitoring) == DatabaseType.Monitoring)
                            kind = UIKind.Monitoring;
                        if (((dbType & DatabaseType.Monitoring) == DatabaseType.Monitoring) && ((dbType & DatabaseType.AutoDosier) == DatabaseType.AutoDosier))
                            kind = UIKind.AutoDosier_Monitoring;

                    }
                }
            }

            //kind = UIKind.ReadOnly;

            int currentWorkgroupID = 0;
#if (RELEASE)
            currentWorkgroupID = WebSaUtilities.GetClientByDBID(dbid);
#endif
            //матрица UI возможностей
            var operationsPoints = GetUIKind(kind);
            bool isShared = WebSaUtilities.IsDbShared(dbid);
            if (isShared)
            {
                var excludingItems = GetChangeingStateElements();
                operationsPoints = operationsPoints.Except(excludingItems).ToArray();
            }

            string projectName = "";
            string databaseName = "";
            string workgroupName = "";

#if (RELEASE)
            if (dbid != default(int))
            {
                ModelConnectionData connectionInfo = WebSaUtilities.ConnectionDataGet(dbid, () => 
                    WebSaUtilities.ConnectionDataGetEx(dbid, currentWorkgroupID)); //данная ситуация наступает когда пользователь обращается по прямой ссылке

                if (connectionInfo != null)
                {
                    projectName = connectionInfo.ProjectData.Item2;
                    workgroupName = connectionInfo.WorkgroupData.Item2;
                    databaseName = connectionInfo.DatabaseData.Item2;
                }
            }
#endif
#if (RELEASE_IS || DEBUG)
            if (saDB != null)
                databaseName = saDB.Name;
#endif

            var gsModel = new GLOBAL_SAModel(operationsPoints)
            {
                StartPoint = startPoint,
                Kind = dbTypeInt.ToString(CultureInfo.InvariantCulture),
                WGID = currentWorkgroupID,
                NetVersion = NetVersion,
                Shared = isShared,
                Workgroup = workgroupName,
                Database = databaseName,
                Project = projectName,
                Mode = mode,
                Edges = new EdgeGroup[0]
            };


            string currentLang = Root.GetCurrentLang();

#if (RELEASE_IS || DEBUG)
            //gsModel.Edges = new Edge[]
            //{
            //    new Edge() { XY = new[] {0, 0}, WH = new[] {2, 2}, ID = 4, Description = "", Code = "check", Title = "Check", Url = @"/{lang}/{db}/check", Enabled = true, Visible = true },
            //    //new Edge() { XY = new[] {2, 0}, WH = new[] {2, 1}, ID = 5, Description = "", Code = "wiki", Title = "Wiki", Url = @"/{lang}/{db}/wiki", Enabled = true, Visible = true  },
            //    new Edge() { XY = new[] {2, 0}, WH = new[] {2, 2}, ID = 2, Description = "", Code = "dashboard", Title = "Dashboard", Url = "/{lang}/wall", Enabled = true, Visible = true  },
            //    new Edge() { XY = new[] {4, 0}, WH = new[] {2, 2}, ID = 7, Description = "", Code = "monitoring", Title = currentLang != "ru-RU" ? "Monitoring (soon)" : "Monitoring (скоро)", Url = @"/{lang}/{db}/monitoring", Enabled = false, Visible = true },
            //    new Edge() { XY = new[] {0, 2}, WH = new[] {4, 2}, ID = 1, Description = "", Code = "analyst", Title = "Analyst", Url = "/{lang}/{db}", Enabled = true, Visible = true  },
            //    new Edge() { XY = new[] {4, 2}, WH = new[] {2, 2}, ID = 6, Description = "", Code = "gs", Title = currentLang != "ru-RU" ? "Global Search (soon)" : "Global Search (скоро)", Url = @"/{lang}/gs", Enabled = false, Visible = true }
            //};

            gsModel.Edges = new[]
            {
    new EdgeGroup
    {
        GroupTitle = Resources.Client.mm,
        ClassName = "main",
        Edges = new[]
        {
            new Edge
            {
                Area = "A",
                XY = new[] {0, 0},
                WH = new[] {2, 2},
                ID = 2,
                Description = "Describe module",
                Code = "dashboard",
                Title = "Dashboard",
                Url = "/{lang}/wall",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "B",
                XY = new[] {2, 0},
                WH = new[] {2, 1},
                ID = 5,
                Description = "",
                Code = "wiki",
                Title = "Wiki",
                Url = @"/{lang}/{db}/wiki",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },

            new Edge
            {
                Area = "B",
                XY = new[] {2, 1},
                WH = new[] {2, 1},
                ID = 4,
                Description = "",
                Code = "check",
                Title = "Check",
                Url = @"/{lang}/{db}/check",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "C",
                XY = new[] {4, 0},
                WH = new[] {2, 2},
                ID = 7,
                Description = "",
                Code = "monitoring",
                Title = currentLang != "ru-RU" ? "Monitoring (soon)" : "Monitoring (скоро)",
                Url = @"/{lang}/{db}/monitoring",
                Enabled = false,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "D",
                XY = new[] {6, 0},
                WH = new[] {2, 1},
                ID = 12,
                Description = "",
                Code = "text",
                Title = "TextMiner",
                Url = "",
                Enabled = false,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "D",
                XY = new[] {6, 1},
                WH = new[] {2, 1},
                ID = 13,
                Description = "",
                Code = "ontology",
                Title = "Ontology Editor",
                Url = "",
                Enabled = false,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "E",
                XY = new[] {0, 2},
                WH = new[] {2, 2},
                ID = 8,
                Description = "",
                Code = "compliance",
                Title = "Compliance check",
                Url = "/{lang}/{db}/inquiry",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "F",
                XY = new[] {2, 2},
                WH = new[] {2, 2},
                ID = 1,
                Description = "",
                Code = "analyst",
                Title = "Analyst",
                Url = "/{lang}/{db}",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "G",
                XY = new[] {4, 2},
                WH = new[] {2, 2},
                ID = 6,
                Description = "",
                Code = "global",
                Title = "Global Search",
                Url = @"abscp:{lang}/module/start/gs",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "H",
                XY = new[] {6, 2},
                WH = new[] {2, 2},
                ID = 11,
                Description = "",
                Code = "enterprise",
                Title = "Enterprise search",
                Url = @"abscp:{lang}/module/start/ts",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            }
        }
    },
    new EdgeGroup
    {
        GroupTitle = Resources.Client.sm,
        ClassName = "services",
        Edges = new[]
        {
            new Edge
            {
                Area = "A",
                XY = new[] {0, 0},
                WH = new[] {2, 2},
                ID = 9,
                Description = "",
                Code = "request",
                Title = "Request Library",
                Url = "/{lang}/{db}/reqlibrary",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                Area = "B",
                XY = new[] {2, 0},
                WH = new[] {2, 2},
                ID = 10,
                Description = "",
                Code = "robot",
                Title = "Robot's collection",
                Url = "/{lang}/{db}/seasources",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
        }
    }
            };


#endif

#if (RELEASE)
gsModel.Edges = new[]
{
    new EdgeGroup
    {
        GroupTitle = Resources.Client.mm,
        Edges = new[]
        {
            new Edge
            {
                XY = new[] {0, 0},
                WH = new[] {4, 2},
                ID = 2,
                Description = "",
                Code = "dashboard",
                Title = "Dashboard",
                Url = "/{lang}/wall",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge
            {
                XY = new[] {0, 2},
                WH = new[] {4, 2},
                ID = 1,
                Description = "",
                Code = "analyst",
                Title = "Analyst",
                Url = "/{lang}/{db}",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
            new Edge()
            {
                XY = new[] {4, 0},
                WH = new[] {2, 4},
                ID = 8,
                Description = "",
                Code = "inquiry",
                Title = "Compliance check",
                Url = "/{lang}/{db}/inquiry",
                Enabled = true,
                Visible = true,
                UrlAbsolute = false
            },
        }
    }
};
#endif

            if (saDB != null)
            {

                gsModel.Meta.SaTypes = new Dictionary<string, int>
    {
        { saDB.MetaModel.System.Organization.SystemName, saDB.MetaModel.System.Organization.ID },
        { saDB.MetaModel.System.Person.SystemName, saDB.MetaModel.System.Person.ID }
    };
            }

            gsModel.IsDev = Scope.IsDev;


            return gsModel;
        }


        static object _sync = new object();
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            ViewBag.TestMessage = "empty";
            if (WebSaUtilities.Database != null)
                ViewBag.TestMessage = "ssid=" + Session.SessionID + "; dbtype=" + WebSaUtilities.Database.DatabaseType + "; name=" + WebSaUtilities.Database.ConnectionInfo.DatabaseName;

            int dbid = -1;
            var dbidParam = (string)filterContext.RouteData.Values["dbid"];
            if (dbidParam != null && dbidParam != "0")
                Int32.TryParse(dbidParam, out dbid);

            var lang = Root.GetCurrentLang();
            var cgv = CalcGlobalView(dbid, lang);

            //устанавливаем значения по умолчанию
            ViewBag.CurrentLang = lang;
            ViewBag.GLOBAL_SA = cgv;
            ViewBag.CureentDatabaseID = dbid; //используется когда переключается язык
            ViewBag.wwwVersion = Root.VersionData.Server;
            ViewBag.clientVersion = Root.VersionData.Client;

            ViewBag.IsSupervizer = Scope.IsSupervizer();

#if (RELEASE)
if (filterContext.ActionDescriptor.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Any())
    return;

//if (filterContext.ActionDescriptor.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Count() == 0)
//{
//    var cp = new ClaimPermission("SA_ADMINISTRATOR", Constants.Operation.InRoles);
//    cp.Demand();
//}

if (!String.IsNullOrWhiteSpace(dbidParam) && dbidParam != "0" && Int32.TryParse(dbidParam, out dbid))
{
    string dbName = WebSaUtilities.IsGlobalShared(dbid);
    if (dbName != null) //если вернула имя БД то в общем доступе (только зная имя БД  мы можем подключиться)
    {
        CheckAndRedirect(dbid, dbName, ref filterContext);

        return;
    }

    if (!User.Identity.IsAuthenticated)
        throw new HttpException(401, "Auth Failed");

    if (WebSaUtilities.HasDatabase(dbid))
    {
        var db = AdminBridgeObserver.GetDatabases(new[] { dbid }).FirstOrDefault();
        if (db != null)
        {
            CheckAndRedirect(db.ID, db.Name, ref filterContext);

            return;
        }
    }
}

if (!User.Identity.IsAuthenticated)
    throw new HttpException(401, "Auth Failed");


string controller = filterContext.ActionDescriptor.ControllerDescriptor.ControllerName.ToLower();
string action = filterContext.ActionDescriptor.ActionName.ToLower();
string area = "";
if (filterContext.RouteData.DataTokens.ContainsKey("area"))
    area = filterContext.RouteData.DataTokens["area"].ToString();

if (filterContext.RequestContext.HttpContext != null && String.IsNullOrWhiteSpace(area))
{
    Trace.Write("BaseControoler.filterContext.RequestContext.HttpContext.Request=" + filterContext.RequestContext.HttpContext.Request.Url);
    var q = HttpUtility.ParseQueryString(filterContext.RequestContext.HttpContext.Request.Url.Query);
    area = q["area"] ?? "";
}

if (controller == "original" && action == "index")
{
    base.OnActionExecuting(filterContext);
    return;
}

if (controller == "home" && action == "main" && filterContext.RouteData.Values["lang"] != null)
{
    if (dbidParam == "0") //используется для корректной работы граней
    {
        filterContext.Result = new RedirectToRouteResult(
            new RouteValueDictionary(new
            {
                controller = "Home",
                action = "Index",
                lang = Root.GetCurrentLang()
            })
            );
        return;
    }

    base.OnActionExecuting(filterContext);
    return;
}

if (controller == "home" && action == "main" && filterContext.RouteData.Values["lang"] == null)
{
    filterContext.Result = new RedirectToRouteResult(
        new RouteValueDictionary(new
        {
            controller = "Home",
            action = "Main",
            lang = Root.GetCurrentLang()
        })
    );

    return;
}

if (controller != "account" && (action != "login" || action != "loginex") && area.ToLower() != "wall")
{
    var returnUrl = area + "/" + controller;
    if (controller == "home") returnUrl = area;

    filterContext.Result = new RedirectToRouteResult(
        new RouteValueDictionary(new
        {
            controller = "Account",
            action = "LoginEx",
            lang = Root.GetCurrentLang(),
            area = "",
            returnUrl
        })
    );

    return;
}

#endif

#if (RELEASE_IS || DEBUG)
            if (filterContext.ActionDescriptor.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).Any())
                return;


            if (!String.IsNullOrWhiteSpace(dbidParam) && dbidParam != "0" && Int32.TryParse(dbidParam, out dbid))
            {
                string dbName = WebSaUtilities.IsGlobalShared(dbid);
                if (dbName != null)
                {
                    CheckAndRedirect(dbid, ref filterContext);
                    return;
                }

                if (!User.Identity.IsAuthenticated)
                    throw new HttpException(401, "Auth Failed");

                CheckAndRedirect(dbid, ref filterContext);
                return;
            }

            if (!User.Identity.IsAuthenticated)
                throw new HttpException(401, "Auth Failed");

            string controller = filterContext.ActionDescriptor.ControllerDescriptor.ControllerName.ToLower();
            string action = filterContext.ActionDescriptor.ActionName.ToLower();
            string area = "";
            if (filterContext.RouteData.DataTokens.ContainsKey("area"))
                area = filterContext.RouteData.DataTokens["area"].ToString();

            if (controller == "original" && action == "index")
            {
                base.OnActionExecuting(filterContext);
                return;
            }

            if (controller == "home" && action == "main" && filterContext.RouteData.Values["lang"] != null)
            {
                if (dbidParam == "0") //используется для корректной работы граней
                {
                    filterContext.Result = new RedirectToRouteResult(
                        new RouteValueDictionary(new
                        {
                            controller = "Home",
                            action = "Index",
                            lang = Root.GetCurrentLang()
                        })
                        );
                    return;
                }

                base.OnActionExecuting(filterContext);
                return;
            }


            if (controller == "home" && action == "main" && filterContext.RouteData.Values["lang"] == null)
            {
                filterContext.Result = new RedirectToRouteResult(
                    new RouteValueDictionary(new
                    {
                        controller = "Home",
                        action = "Main",
                        lang = Root.GetCurrentLang()
                    })
                );

                return;
            }


            if (controller != "account" && (action != "login" || action != "loginex") && area.ToLower() != "wall")
            {
                var returnUrl = area + "/" + controller;
                if (controller == "home") returnUrl = area;

                filterContext.Result = new RedirectToRouteResult(
                    new RouteValueDictionary(new
                    {
                        controller = "Account",
                        action = "Login",
                        lang = Root.GetCurrentLang(),
                        area = "",
                        returnUrl
                    })
                );

                return;
            }

#endif

            base.OnActionExecuting(filterContext);
        }

#if (RELEASE)
private void CheckAndRedirect(int loginDBID, string dbName, ref ActionExecutingContext context)
{
if (WebSaUtilities.ConnectorInstance.InitConnectionAndTry(loginDBID, dbName))
{
    ViewBag.GLOBAL_SA = CalcGlobalView(loginDBID);
    ViewBag.CurrentLang = Root.GetCurrentLang();
    ViewBag.CureentDatabaseID = loginDBID; //используется когда переключается язык


    //if (context.ActionDescriptor.ActionName != "IndexR" && (HttpContext.Request.UrlReferrer == null || HttpContext.Request.UrlReferrer.Host != HttpContext.Request.Url.Host))
    //{
    //    TempData["ret"] = HttpContext.Request.RawUrl;
    //    context.Result = new RedirectToRouteResult(
    //        new RouteValueDictionary(new
    //        {
    //            controller = "Home",
    //            action = "IndexR",
    //            dbid = loginDBID,
    //            lang = Root.GetCurrentLang()
    //        })
    //        );
    //}
}

/*
int? currentLogicID = Session["loginDBID"] != null ? (int)Session["loginDBID"] : (int?)null;

if (!currentLogicID.HasValue || WebUtilities.GetDatabaseID() == null || currentLogicID != loginDBID || !WebUtilities.IsConnected)
{
    if (WebUtilities.InitConnectionAndTry(dbName))
    {
        //нужно чтобы сохранить информацию о логической БД при изменении адреса
        //этот факт станет тригером для инициации подключения

        Session["loginDBID"] = loginDBID;
        context.Result = new RedirectToRouteResult(
            new RouteValueDictionary(new
            {
                controller = "Home",
                action = "Index",
                dbid = loginDBID,
                lang = Root.GetCurrentLang()
            })
            );
    }
}
*/
        }
#endif

#if (RELEASE_IS || DEBUG)
        private void CheckAndRedirect(int dbid, ref ActionExecutingContext context)
        {
            var saDb = WebSaUtilities.ConnectorInstance.GetDataBase(dbid, 0);
            if (saDb != null)
            {
                var lang = Root.GetCurrentLang();
                ViewBag.GLOBAL_SA = CalcGlobalView(dbid, lang);
                ViewBag.CurrentLang = lang;
                ViewBag.CureentDatabaseID = dbid; //используется когда переключается язык

                //if (context.ActionDescriptor.ActionName != "IndexR" && (HttpContext.Request.UrlReferrer == null || HttpContext.Request.UrlReferrer.Host != HttpContext.Request.Url.Host))
                //{
                //    TempData["ret"] = HttpContext.Request.RawUrl;
                //    context.Result = new RedirectToRouteResult(
                //        new RouteValueDictionary(new
                //        {
                //            controller = "Home",
                //            action = "IndexR",
                //            dbid = dbid,
                //            lang = Root.GetCurrentLang()
                //        })
                //        );
                //}
            }
        }

#endif
    }
}
